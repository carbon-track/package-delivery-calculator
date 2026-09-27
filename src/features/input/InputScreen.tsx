import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Camera,
  Sparkles,
  PenLine,
  ArrowRight,
  ShieldCheck,
  Check,
  Package,
  Truck,
  X,
  LoaderCircle,
} from 'lucide-react';
import {
  categories,
  categoryLabels,
  componentTypes,
  componentLabels,
  materials,
  materialLabels,
  transportModes,
  transportLabels,
  known,
  unknown,
  valueOf,
  type PackageInput,
  type PackageComponent,
  type ValueState,
} from '../../types/domain';
import { newComponent } from '../../data/demo/package';
import { DraftResponseSchema, type DraftResponse } from '../ai/schemas';
import { Button, StepHeading, Navigation, Notice } from '../../components/Shared';
import { PackageArt } from '../../components/Illustrations';

export function StateChip({ value }: { value: ValueState<unknown> }) {
  return (
    <span className={`state-chip ${value.kind}`}>
      {value.kind === 'known' ? '用户确认' : value.kind === 'estimated' ? '模板估计' : '暂不确定'}
    </span>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  max = 100000,
  unit = 'g',
}: {
  label: string;
  value: ValueState<number>;
  onChange: (v: ValueState<number>) => void;
  max?: number;
  unit?: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        <StateChip value={value} />
      </span>
      <div className="unit-field">
        <input
          aria-label={label}
          type="number"
          min="0"
          max={max}
          step="any"
          placeholder="未知"
          value={valueOf(value) ?? ''}
          onChange={(e) =>
            onChange(e.target.value === '' ? unknown() : known(e.target.valueAsNumber))
          }
        />
        <span>{unit}</span>
      </div>
    </label>
  );
}
export function ComponentEditor({
  components,
  onChange,
}: {
  components: PackageComponent[];
  onChange: (c: PackageComponent[]) => void;
}) {
  const update = (id: string, patch: Partial<PackageComponent>) =>
    onChange(components.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  return (
    <div className="components-editor">
      {components.map((c, i) => (
        <div className="component-card" key={c.id}>
          <div className="component-card-title">
            <span className="component-index">{String(i + 1).padStart(2, '0')}</span>
            <strong>{componentLabels[c.type]}</strong>
            <button
              className="icon-button remove"
              aria-label={`移除${componentLabels[c.type]} ${i + 1}`}
              onClick={() => onChange(components.filter((x) => x.id !== c.id))}
            >
              <Trash2 size={17} />
            </button>
          </div>
          <div className="component-fields">
            <label className="field">
              <span>包装类型</span>
              <select
                value={c.type}
                onChange={(e) => update(c.id, { type: e.target.value as PackageComponent['type'] })}
              >
                {componentTypes.map((t) => (
                  <option value={t} key={t}>
                    {componentLabels[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>
                材料
                <StateChip value={c.material} />
              </span>
              <select
                value={valueOf(c.material) ?? 'unknown'}
                onChange={(e) =>
                  update(c.id, {
                    material:
                      e.target.value === 'unknown'
                        ? unknown()
                        : known(e.target.value as (typeof materials)[number]),
                  })
                }
              >
                {materials.map((m) => (
                  <option value={m} key={m}>
                    {materialLabels[m]}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label={`${componentLabels[c.type]}单件重量`}
              value={c.massGrams}
              onChange={(v) => update(c.id, { massGrams: v })}
            />
            <label className="field quantity-field">
              <span>件数</span>
              <input
                type="number"
                min="1"
                max="100"
                value={c.quantity}
                onChange={(e) => update(c.id, { quantity: e.target.valueAsNumber })}
              />
            </label>
          </div>
        </div>
      ))}
      <button
        className="add-component"
        disabled={components.length >= 30}
        onClick={() =>
          onChange([...components, { ...newComponent(), layerOrder: components.length }])
        }
      >
        <Plus size={18} />
        添加一层包装
      </button>
      {components.length === 0 && (
        <Notice>
          当前已明确不使用包装，因此包装模块计为零；如果只是尚未填写，请添加部件并保留未知字段。
        </Notice>
      )}
    </div>
  );
}
function AiHelper({
  onAdd,
  remaining,
}: {
  onAdd: (components: PackageComponent[]) => void;
  remaining: number;
}) {
  const [tab, setTab] = useState<'text' | 'photo'>('text'),
    [text, setText] = useState(''),
    [image, setImage] = useState<string>();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [draft, setDraft] = useState<DraftResponse | null>(null);
  const [selected, setSelected] = useState<number[]>([]),
    [accepted, setAccepted] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const clearDraft = () => {
    setDraft(null);
    setAccepted(false);
    setError('');
  };
  async function generate() {
    setBusy(true);
    clearDraft();
    const current = new AbortController();
    controller.current = current;
    const timeout = setTimeout(() => current.abort(), 25000);
    try {
      const response = await fetch('/api/ai/package-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tab === 'photo' ? { imageBase64: image } : { text }),
        signal: current.signal,
      });
      const data: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'AI 草稿不可用，请手动添加。',
        );
      const parsed = DraftResponseSchema.parse(data);
      setDraft(parsed);
      setSelected(parsed.components.map((_, i) => i));
    } catch (e) {
      if (controller.current === current)
        setError(
          e instanceof Error && e.name !== 'AbortError' && !e.message.includes('[')
            ? e.message
            : 'AI 草稿暂时不可用。请在左侧手动添加包装，其他功能不受影响。',
        );
    } finally {
      clearTimeout(timeout);
      setBusy(false);
      setImage(undefined);
    }
  }
  function accept() {
    if (!draft || selected.length > remaining) return;
    const items = draft.components
      .filter((_, i) => selected.includes(i))
      .map((c) => ({
        ...newComponent(c.type === 'unknown' ? 'other' : c.type),
        material:
          c.material === 'unknown' ? unknown<(typeof materials)[number]>() : known(c.material),
        quantity: c.quantity ?? 1,
      }));
    onAdd(items);
    setDraft(null);
    setText('');
    setAccepted(true);
  }
  return (
    <section className="card ai-helper">
      <div className="card-heading">
        <span className="icon-tile purple">
          <Sparkles size={21} />
        </span>
        <div>
          <h2>让小助手搭把手</h2>
          <p>可选 · 所有建议都由你确认</p>
        </div>
      </div>
      <div className="segmented" role="group" aria-label="辅助输入方式">
        <button
          aria-pressed={tab === 'text'}
          disabled={busy}
          className={tab === 'text' ? 'active' : ''}
          onClick={() => {
            setTab('text');
            clearDraft();
            setImage(undefined);
          }}
        >
          <PenLine size={16} />
          描述包裹
        </button>
        <button
          aria-pressed={tab === 'photo'}
          disabled={busy}
          className={tab === 'photo' ? 'active' : ''}
          onClick={() => {
            setTab('photo');
            clearDraft();
          }}
        >
          <Camera size={16} />
          上传照片
        </button>
      </div>
      {tab === 'text' ? (
        <>
          <label className="sr-only" htmlFor="package-description">
            描述你的包裹
          </label>
          <textarea
            id="package-description"
            maxLength={1000}
            disabled={busy}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              clearDraft();
            }}
            placeholder="例如：一双鞋，外面有快递纸箱，里面有鞋盒、牛皮纸和胶带。"
          />
          <div className="textarea-count">{text.length} / 1000</div>
          <button
            className="example-prompt"
            disabled={busy}
            onClick={() => {
              setText('一双鞋，外面有快递纸箱，里面有鞋盒、牛皮纸和封箱胶带。');
              clearDraft();
            }}
          >
            试试：一双鞋的快递包裹 <ArrowRight size={14} />
          </button>
        </>
      ) : (
        <label className="upload-zone">
          {image ? (
            <img src={image} alt="本次待识别的包装照片" />
          ) : (
            <>
              <Camera size={35} />
              <strong>选择一张包装照片</strong>
              <span>JPG、PNG、WebP · 最大 2 MB</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            aria-label="上传包装照片"
            onChange={(e) => {
              clearDraft();
              const f = e.target.files?.[0];
              if (!f) return;
              if (
                f.size > 2 * 1024 * 1024 ||
                !['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
              ) {
                setError('请选择 2 MB 以内的 JPG、PNG 或 WebP 图片。');
                setImage(undefined);
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setImage(String(reader.result));
              reader.readAsDataURL(f);
            }}
          />
        </label>
      )}
      <Button
        variant="secondary"
        className="full-width"
        disabled={busy || (tab === 'text' ? !text.trim() : !image)}
        onClick={generate}
      >
        {busy ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}{' '}
        {busy ? '正在识别包装…' : '生成待确认草稿'}
      </Button>
      {error && (
        <div role="alert">
          <Notice kind="warning">{error}</Notice>
        </div>
      )}
      {draft && (
        <div className="ai-draft">
          <h3>确认需要添加的包装</h3>
          <p>
            勾选并添加即表示你已核对类型、材料和件数。重量仍保留未知；未知件数暂按 1
            件，添加后可编辑。
          </p>
          {draft.components.map((c, i) => (
            <label className="draft-choice" key={i}>
              <input
                type="checkbox"
                checked={selected.includes(i)}
                onChange={(e) =>
                  setSelected(e.target.checked ? [...selected, i] : selected.filter((v) => v !== i))
                }
              />
              <span>
                {c.type === 'unknown' ? '未知部件' : componentLabels[c.type]} ·{' '}
                {materialLabels[c.material]} · {c.quantity ?? '未知'} 件
              </span>
            </label>
          ))}
          {draft.draftWarnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
          {draft.unknownFields.length > 0 && <p>待补充：{draft.unknownFields.join('、')}</p>}
          {selected.length > remaining && (
            <Notice kind="warning">当前还可添加 {remaining} 层，请减少勾选的部件。</Notice>
          )}
          <Button disabled={!selected.length || selected.length > remaining} onClick={accept}>
            <Check size={16} />
            我已核对，添加所选部件
          </Button>
          <button className="text-button" onClick={() => setDraft(null)}>
            <X size={14} />
            丢弃草稿
          </button>
        </div>
      )}
      {accepted && <Notice kind="success">已添加确认的包装，请补充重量或保留未知。</Notice>}
      <p className="helper-privacy">
        <ShieldCheck size={16} />
        照片仅用于本次识别，不写入本地记录。请遮住面单个人信息。AI 不会推算重量、路线或排放值。
      </p>
    </section>
  );
}
export function InputScreen({
  draft,
  onChange,
  onBack,
  onNext,
}: {
  draft: PackageInput;
  onChange: (p: PackageInput) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <StepHeading
        eyebrow="01 / BUILD YOUR PACKAGE"
        title="从一个包裹开始"
        description="把包装一层层加进来。不确定的地方，可以先留空。"
      />
      <div className="input-layout">
        <div className="input-main">
          <section className="card">
            <div className="card-heading">
              <span className="icon-tile orange">
                <Package size={22} />
              </span>
              <div>
                <h2>包裹里有什么？</h2>
                <p>从物品到外包装，记录你知道的部分</p>
              </div>
            </div>
            <div className="two-fields">
              <label className="field">
                <span>物品种类</span>
                <select
                  value={draft.item.category}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      item: { category: e.target.value as PackageInput['item']['category'] },
                    })
                  }
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabels[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>这个包裹是</span>
                <select
                  value={draft.packageContext}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      packageContext: e.target.value as PackageInput['packageContext'],
                    })
                  }
                >
                  <option value="received">我已经收到的</option>
                  <option value="planning_purchase">我打算购买的</option>
                </select>
              </label>
            </div>
            <ComponentEditor
              components={draft.components}
              onChange={(components) => onChange({ ...draft, components })}
            />
          </section>
          <section className="card route-input">
            <div className="card-heading">
              <span className="icon-tile blue">
                <Truck size={22} />
              </span>
              <div>
                <h2>它从哪里来？</h2>
                <p>路线只作示意，城市不会自动换算为距离</p>
              </div>
            </div>
            <div className="two-fields">
              <label className="field">
                <span>发货城市 / 地区</span>
                <input
                  maxLength={100}
                  placeholder="例如：杭州"
                  value={draft.route.origin.label}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      route: { ...draft.route, origin: { label: e.target.value } },
                    })
                  }
                />
              </label>
              <label className="field">
                <span>收货城市 / 地区</span>
                <input
                  maxLength={100}
                  placeholder="例如：上海"
                  value={draft.route.destination.label}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      route: { ...draft.route, destination: { label: e.target.value } },
                    })
                  }
                />
              </label>
              <NumberField
                label="运输距离"
                unit="km"
                max={50000}
                value={draft.route.distanceKm}
                onChange={(distanceKm) =>
                  onChange({ ...draft, route: { ...draft.route, distanceKm } })
                }
              />
              <label className="field">
                <span>
                  运输方式
                  <StateChip value={draft.route.transportMode} />
                </span>
                <select
                  value={valueOf(draft.route.transportMode) ?? 'unknown'}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      route: {
                        ...draft.route,
                        transportMode:
                          e.target.value === 'unknown'
                            ? unknown()
                            : known(e.target.value as (typeof transportModes)[number]),
                      },
                    })
                  }
                >
                  {transportModes.map((m) => (
                    <option key={m} value={m}>
                      {transportLabels[m]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>
        <aside>
          <AiHelper
            remaining={30 - draft.components.length}
            onAdd={(components) =>
              onChange({ ...draft, components: [...draft.components, ...components] })
            }
          />
          <div className="package-preview">
            <PackageArt />
            <div>
              <span className="eyebrow">YOUR LITTLE PACKAGE</span>
              <h3>一点点，拼出完整旅程</h3>
              <p>
                已经添加 {draft.components.length} 层包装。
                <br />
                不知道也没关系，我们会标记它。
              </p>
            </div>
          </div>
        </aside>
      </div>
      <Navigation back="回到首页" next="看看我的包裹" onBack={onBack} onNext={onNext} />
    </>
  );
}
