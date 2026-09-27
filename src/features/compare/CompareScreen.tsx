import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Undo2,
  PackageMinus,
  MapPin,
  RotateCcw,
  ArrowRight,
  LockKeyhole,
  BookOpen,
  Plus,
  Check,
  Leaf,
} from 'lucide-react';
import { applyScenario, calculatePackage, compareScenario } from '../../calculator';
import { dataset } from '../../data/demo/package';
import {
  type PackageInput,
  type Scenario,
  type ScenarioType,
  type PackageComponent,
  valueOf,
  estimated,
} from '../../types/domain';
import {
  Button,
  StepHeading,
  Navigation,
  ResultNumber,
  formatKg,
  Notice,
} from '../../components/Shared';
import { PackageArt } from '../../components/Illustrations';
import { ComponentEditor, NumberField } from '../input/InputScreen';
export const scenarioOptions = [
  {
    type: 'return' as const,
    title: '如果我退货',
    subtitle: '看看多一段旅程的影响',
    icon: Undo2,
    color: 'orange',
  },
  {
    type: 'less_packaging' as const,
    title: '少一点包装',
    subtitle: '在保护物品的前提下做减法',
    icon: PackageMinus,
    color: 'green',
  },
  {
    type: 'closer_origin' as const,
    title: '从更近处出发',
    subtitle: '同样的物品，更短的距离',
    icon: MapPin,
    color: 'blue',
  },
];
export function defaultScenario(type: ScenarioType, base: PackageInput): Scenario {
  if (type === 'return')
    return {
      type,
      returnDestination: structuredClone(base.route.origin),
      returnDistanceKm: structuredClone(base.route.distanceKm),
      extraPackaging: [],
    };
  if (type === 'closer_origin')
    return {
      type,
      alternativeOrigin: { label: '更近的发货地（假设）' },
      alternativeDistanceKm:
        valueOf(base.route.distanceKm) === undefined
          ? { kind: 'unknown' }
          : estimated((valueOf(base.route.distanceKm) ?? 0) / 2, 'closer-origin-scenario-v1'),
      assumptionNote: '物品、包装、收货地与运输方式均保持不变。',
    };
  return {
    type,
    replacementComponents: base.components.map((c) =>
      c.type === 'paper_filler' && valueOf(c.massGrams) !== undefined
        ? {
            ...structuredClone(c),
            massGrams: estimated((valueOf(c.massGrams) ?? 0) / 2, 'less-packaging-scenario-v1'),
          }
        : structuredClone(c),
    ),
    protectionConditionNote: '减少填充仅是比较假设，请先确认物品仍能安全运输。',
  };
}
export function CompareScreen({
  baseline,
  scenario,
  onScenario,
  onBack,
  onNext,
  onSources,
  reduced = false,
}: {
  baseline: PackageInput;
  scenario: Scenario | null;
  onScenario: (s: Scenario | null) => void;
  onBack: () => void;
  onNext: () => void;
  onSources: () => void;
  reduced?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const calculation = useMemo(() => {
    try {
      const alternative = scenario ? applyScenario(baseline, scenario) : baseline;
      return { comparison: compareScenario(baseline, alternative, dataset), error: '' };
    } catch (e) {
      return { comparison: null, error: e instanceof Error ? e.message : '情景输入无效' };
    }
  }, [baseline, scenario]);
  const original = useMemo(() => calculatePackage(baseline, dataset), [baseline]);
  const comparison = calculation.comparison,
    selected = scenarioOptions.find((s) => s.type === scenario?.type);
  const delta = scenario ? (comparison?.deltaKgCO2e ?? null) : null;
  const percentage =
    delta !== null && original.coveredTotalKgCO2e > 0
      ? (delta / original.coveredTotalKgCO2e) * 100
      : null;
  const updateComponents = (components: PackageComponent[]) => {
    if (scenario?.type === 'less_packaging')
      onScenario({ ...scenario, replacementComponents: components });
    else if (scenario?.type === 'return') onScenario({ ...scenario, extraPackaging: components });
  };
  return (
    <>
      <StepHeading
        eyebrow="04 / ONE CHANGE, A NEW POSSIBILITY"
        title="如果，换一种选择？"
        description="每次只改变一件事。原始包裹始终保留在这里。"
      />
      <div className="scenario-tabs" role="group" aria-label="选择一个比较情景">
        {scenarioOptions.map((s) => (
          <button
            key={s.type}
            className={`scenario-option ${s.color} ${scenario?.type === s.type ? 'selected' : ''}`}
            aria-pressed={scenario?.type === s.type}
            onClick={() => {
              onScenario(defaultScenario(s.type, baseline));
              setEditing(false);
            }}
          >
            <span className={`icon-tile ${s.color}`}>
              <s.icon size={26} />
            </span>
            <span>
              <strong>{s.title}</strong>
              <small>{s.subtitle}</small>
            </span>
            {scenario?.type === s.type && <Check className="selection-check" size={18} />}
          </button>
        ))}
      </div>
      {scenario && (
        <section className={`scenario-settings card ${selected?.color}`}>
          <div className="settings-heading">
            <div>
              <h3>{selected?.title} · 情景设置</h3>
              <p>
                {scenario.type === 'less_packaging'
                  ? scenario.protectionConditionNote
                  : scenario.type === 'closer_origin'
                    ? scenario.assumptionNote
                    : '新增一段退货运输，沿用原运输方式；需要时添加新的包装。'}
              </p>
            </div>
            {scenario.type !== 'closer_origin' && (
              <Button variant="secondary" onClick={() => setEditing(!editing)}>
                {editing
                  ? '收起编辑'
                  : scenario.type === 'return'
                    ? '编辑新增包装'
                    : '编辑包装变化'}
              </Button>
            )}
          </div>
          {scenario.type === 'closer_origin' && (
            <div className="two-fields">
              <label className="field">
                <span>新的发货城市 / 地区</span>
                <input
                  maxLength={100}
                  value={scenario.alternativeOrigin.label}
                  onChange={(e) =>
                    onScenario({ ...scenario, alternativeOrigin: { label: e.target.value } })
                  }
                />
              </label>
              <NumberField
                label="更近产地的距离"
                unit="km"
                max={valueOf(baseline.route.distanceKm) ?? 50000}
                value={scenario.alternativeDistanceKm}
                onChange={(alternativeDistanceKm) =>
                  onScenario({ ...scenario, alternativeDistanceKm })
                }
              />
            </div>
          )}
          {scenario.type === 'return' && (
            <>
              <div className="two-fields">
                <label className="field">
                  <span>退货目的地</span>
                  <input
                    maxLength={100}
                    value={scenario.returnDestination.label}
                    onChange={(e) =>
                      onScenario({ ...scenario, returnDestination: { label: e.target.value } })
                    }
                  />
                </label>
                <NumberField
                  label="退货运输距离"
                  unit="km"
                  max={50000}
                  value={scenario.returnDistanceKm}
                  onChange={(returnDistanceKm) => onScenario({ ...scenario, returnDistanceKm })}
                />
              </div>
              {!editing && (
                <p className="micro-copy">
                  {scenario.extraPackaging.length
                    ? `新增 ${scenario.extraPackaging.length} 层包装`
                    : '当前假设：完整复用原包装，不额外添加材料。'}
                </p>
              )}
            </>
          )}
          {editing && scenario.type !== 'closer_origin' && (
            <ComponentEditor
              components={
                scenario.type === 'return'
                  ? scenario.extraPackaging
                  : scenario.replacementComponents
              }
              onChange={updateComponents}
            />
          )}
        </section>
      )}
      {calculation.error && (
        <div role="alert">
          <Notice kind="warning">{calculation.error}。请检查非负重量、件数和距离。</Notice>
        </div>
      )}
      <div className="comparison-grid">
        <section className="card comparison-card baseline">
          <div className="comparison-title">
            <span className="icon-tile sand">
              <LockKeyhole size={20} />
            </span>
            <div>
              <h2>原始包裹</h2>
              <p>固定基准 · 不随情景改变</p>
            </div>
          </div>
          <div className="comparison-visual">
            <PackageArt />
          </div>
          <ResultNumber result={original} small />
          <div className="comparison-line">
            <span>包装</span>
            <strong>
              {original.packaging.status === 'not_calculable'
                ? '未知'
                : formatKg(original.packaging.kgCO2eCovered)}{' '}
              kg
            </strong>
          </div>
          <div className="comparison-line">
            <span>去程运输</span>
            <strong>
              {original.transport.status === 'not_calculable'
                ? '未知'
                : formatKg(original.transport.kgCO2eCovered)}{' '}
              kg
            </strong>
          </div>
        </section>
        <div
          className={`delta-card ${delta !== null && delta > 0 ? 'increase' : ''}`}
          aria-live="polite"
        >
          <span className="delta-leaf">
            <Leaf size={30} />
          </span>
          <span>{scenario ? '演示估算的变化' : '小小改变，新的发现'}</span>
          <strong>
            {percentage !== null ? `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%` : '—'}
          </strong>
          <b>
            {delta !== null
              ? `${delta > 0 ? '+' : ''}${formatKg(delta)} kg CO₂e`
              : scenario
                ? '暂不计算总差值'
                : '选一个情景试试看'}
          </b>
          <p>
            {delta === null
              ? scenario
                ? '覆盖不足时，不把部分结果当作总量比较。'
                : '退货、减少包装或更近的产地，每次探索一种可能。'
              : delta > 0
                ? '这个假设增加了模型内的覆盖排放。'
                : delta < 0
                  ? '这个假设减少了模型内的覆盖排放。'
                  : '当前设置没有改变计算结果。'}
          </p>
          <ArrowRight size={27} />
        </div>
        <section className={`card comparison-card alternative ${selected?.color ?? ''}`}>
          <div className="comparison-title">
            <span className={`icon-tile ${selected?.color ?? 'green'}`}>
              {selected ? <selected.icon size={21} /> : <Plus size={21} />}
            </span>
            <div>
              <h2>{selected?.title ?? '另一种可能'}</h2>
              <p>{selected ? '仅应用当前选中的情景' : '你的实验，等你开启'}</p>
            </div>
          </div>
          <div className="comparison-visual">
            <motion.div
              key={scenario?.type}
              initial={{ opacity: reduced ? 1 : 0.3, scale: reduced ? 1 : 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.3 }}
            >
              <PackageArt variant={scenario?.type === 'less_packaging' ? 'green' : 'box'} />
            </motion.div>
            {scenario?.type === 'return' && (
              <span className="visual-badge">
                <Undo2 size={22} />
                增加退货行程
              </span>
            )}
            {scenario?.type === 'closer_origin' && (
              <span className="visual-badge">
                <MapPin size={22} />
                {valueOf(scenario.alternativeDistanceKm) ?? '未知'} km
              </span>
            )}
          </div>
          {scenario && comparison ? (
            <>
              <ResultNumber result={comparison.alternativeResult} small />
              <div className="comparison-line">
                <span>
                  包装 + 去程运输
                  {comparison.alternativeResult.packaging.status !== 'calculated' ||
                  comparison.alternativeResult.transport.status !== 'calculated'
                    ? '（已覆盖）'
                    : ''}
                </span>
                <strong>
                  {comparison.alternativeResult.packaging.status === 'not_calculable' &&
                  comparison.alternativeResult.transport.status === 'not_calculable'
                    ? '未知'
                    : `${formatKg(comparison.alternativeResult.packaging.kgCO2eCovered + comparison.alternativeResult.transport.kgCO2eCovered)} kg`}
                </strong>
              </div>
              {comparison.alternativeResult.returnTrip && (
                <div className="comparison-line">
                  <span>退货新增 · 包装与运输</span>
                  <strong>
                    {comparison.alternativeResult.returnTrip.status === 'not_calculable'
                      ? '未知'
                      : formatKg(comparison.alternativeResult.returnTrip.kgCO2eCovered)}{' '}
                    kg
                  </strong>
                </div>
              )}
            </>
          ) : (
            <div className="empty-comparison">
              <strong>?</strong>
              <p>{calculation.error ? '修正输入后查看结果' : '先选择上方的一个情景'}</p>
            </div>
          )}
        </section>
      </div>
      {scenario && scenario.type !== 'less_packaging' && (
        <div className={`scenario-route-strip ${selected?.color}`}>
          <strong>{scenario.type === 'return' ? '追加退货旅程' : '缩短这一段运输'}</strong>
          <svg
            viewBox="0 0 440 50"
            role="img"
            aria-label={
              scenario.type === 'return'
                ? '原运输保持不变，新增独立的反向退货路线'
                : '原始距离与更近产地距离的示意对比'
            }
          >
            <path d="M20 16H420" stroke="#d5dacb" strokeWidth="4" strokeDasharray="5 6" />
            {scenario.type === 'return' ? (
              <motion.path
                key="return-line"
                d="M420 33H20"
                stroke="#c78e57"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: reduced ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduced ? 0 : 0.7 }}
              />
            ) : (
              <motion.path
                key="shorter-line"
                d="M20 33H420"
                stroke="#6097ae"
                strokeWidth="5"
                strokeLinecap="round"
                animate={{
                  pathLength: Math.min(
                    1,
                    Math.max(
                      0,
                      (valueOf(scenario.alternativeDistanceKm) ?? 0) /
                        (valueOf(baseline.route.distanceKm) || 1),
                    ),
                  ),
                }}
                transition={{ duration: reduced ? 0 : 0.5 }}
              />
            )}
            <circle cx="20" cy="16" r="5" fill="#86a77a" />
            <circle cx="420" cy="16" r="5" fill="#86a77a" />
          </svg>
          <small>原包裹条件固定 · 距离示意非实际轨迹</small>
        </div>
      )}
      {scenario && comparison && (
        <div className="card changes-card">
          <h3>具体改变了什么？</h3>
          {comparison.changedFields.length ? (
            comparison.changedFields.map((c) => (
              <div className="changed-row" key={c.fieldPath}>
                <span>{c.baselineLabel}</span>
                <ArrowRight size={17} />
                <strong>{c.alternativeLabel}</strong>
              </div>
            ))
          ) : (
            <p>尚未发生变化。编辑部件重量、材料或件数，试试一个具体调整。</p>
          )}
          <p className="micro-copy">{comparison.comparisonNotes.join(' ')}</p>
          {comparison.alternativeResult.returnTrip?.lineItems.map((l) => (
            <div className="comparison-line" key={l.id}>
              <span>
                {l.label} · {l.quantity} {l.unit} × {l.factorValue}
              </span>
              <strong>{formatKg(l.kgCO2e)} kg</strong>
            </div>
          ))}
          {comparison.alternativeResult.missingFields.length > 0 && (
            <Notice kind="warning">
              {comparison.alternativeResult.missingFields.map((m) => m.message).join('；')}
            </Notice>
          )}
        </div>
      )}
      <div className="sources-strip">
        <button className="text-button" onClick={onSources}>
          <BookOpen size={19} />
          假设与数据来源
        </button>
        <Button
          variant="secondary"
          onClick={() => {
            onScenario(null);
            setEditing(false);
          }}
        >
          <RotateCcw size={17} />
          恢复原始包裹
        </Button>
      </div>
      <Navigation back="回看包裹旅程" next="带走一个小行动" onBack={onBack} onNext={onNext} />
    </>
  );
}
