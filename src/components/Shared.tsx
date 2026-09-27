import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowRight, ArrowLeft, X, Info, BookOpen, Leaf } from 'lucide-react';
import { dataset } from '../data/demo/package';
import { materialLabels, transportLabels, type CalculationResult } from '../types/domain';
export const formatKg = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`button ${variant} ${className}`}
    >
      {children}
    </button>
  );
}
export function StepHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="step-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 tabIndex={-1}>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function Navigation({
  back,
  next,
  onBack,
  onNext,
}: {
  back: string;
  next: string;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flow-navigation">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft size={18} />
        {back}
      </Button>
      <Button onClick={onNext}>
        {next}
        <ArrowRight size={18} />
      </Button>
    </div>
  );
}
export function Notice({
  children,
  kind = 'info',
}: {
  children: ReactNode;
  kind?: 'info' | 'warning' | 'success';
}) {
  return (
    <div className={`notice ${kind}`}>
      <Info size={17} />
      <div>{children}</div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    d?.showModal();
    return () => {
      d?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="关闭弹窗">
          <X size={22} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Sources({ result }: { result?: CalculationResult }) {
  return (
    <div className="sources-content">
      <Notice kind="warning">
        <strong>这是一套教学演示数据。</strong>{' '}
        所有因子均为人为设置，尚未经真实地区数据验证。即使填写了真实包裹信息，也不能将结果用作真实碳核算或环保声明。
      </Notice>
      <h3>
        <BookOpen size={19} /> 计算边界
      </h3>
      <p>
        只计算包装材料与配送。商品制造、使用、回收和废弃处理均未纳入。完整仅指本模型内的数据覆盖完整。
      </p>
      <div className="formula">
        包装 = 单件重量（kg）× 件数 × 材料因子
        <br />
        运输 = 距离（km）× 每包裹公里因子
        <br />
        退货 = 原包裹 + 新增包装 + 独立退货运输
      </div>
      <h3>数据版本与来源</h3>
      <p>
        <code>{dataset.version}</code> · {dataset.year} · {dataset.region}
      </p>
      <p>来源为项目内教学夹具，非文献测量值。没有可验证的外部来源，因此未提供虚构的科学引用。</p>
      <div className="factor-table">
        <table>
          <caption>演示材料系数（kgCO₂e/kg）</caption>
          <thead>
            <tr>
              <th>材料</th>
              <th>系数</th>
              <th>引用 ID</th>
            </tr>
          </thead>
          <tbody>
            {dataset.materials.map((f) => (
              <tr key={f.material}>
                <td>{materialLabels[f.material]}</td>
                <td>{f.kgCO2ePerKg}</td>
                <td>{f.sourceRefId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="factor-table">
        <table>
          <caption>演示运输系数（kgCO₂e/包裹·km）</caption>
          <thead>
            <tr>
              <th>方式</th>
              <th>系数</th>
              <th>引用 ID</th>
            </tr>
          </thead>
          <tbody>
            {dataset.transport.map((f) => (
              <tr key={f.mode}>
                <td>{transportLabels[f.mode]}</td>
                <td>{f.kgCO2ePerParcelKm}</td>
                <td>{f.sourceRefId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        分摊假设：每包裹每公里固定分摊，不使用商品重量或车辆载重。吨公里因子在没有完整货物重量时会被明确标为不可计算。
      </p>
      {result && (
        <>
          <h3>本次计算的假设</h3>
          <ul>
            {result.assumptions.map((a) => (
              <li key={a.id}>{a.message}</li>
            ))}
          </ul>
          <h3>可追溯计算明细</h3>
          {[result.packaging, result.transport, ...(result.returnTrip ? [result.returnTrip] : [])]
            .flatMap((m) => m.lineItems)
            .map((l) => (
              <div className="source-line" key={l.id}>
                <strong>{l.label}</strong>
                <span>
                  {l.quantity} {l.unit} × {l.factorValue} = {formatKg(l.kgCO2e)} kgCO₂e
                </span>
                <small>{l.sourceRefIds.join(' · ')}</small>
              </div>
            ))}
          {result.missingFields.length > 0 && (
            <>
              <h3>未覆盖项目</h3>
              <ul>
                {result.missingFields.map((m) => (
                  <li key={m.fieldPath}>{m.message}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <div className="privacy-note">
        <Leaf size={20} />{' '}
        无账户、无数据库、默认无遥测。包裹与行动保存在当前浏览器；照片不写入本地存储，AI
        启用时仅发送给推理服务。请避免上传含姓名、电话、详细地址的面单。
      </div>
    </div>
  );
}
export function ResultNumber({
  result,
  small = false,
}: {
  result: CalculationResult;
  small?: boolean;
}) {
  return (
    <div className={`result-number ${small ? 'small' : ''}`}>
      <strong>
        {result.completeness === 'not_calculable' ? '—' : formatKg(result.coveredTotalKgCO2e)}
      </strong>
      <span>kg CO₂e</span>
      <small>
        {result.completeness === 'complete'
          ? '模型内覆盖完整 · 演示估算'
          : result.completeness === 'partial'
            ? '仅已覆盖部分 · 不是总量'
            : '信息不足 · 暂不可计算'}
      </small>
    </div>
  );
}
