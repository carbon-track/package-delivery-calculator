import { useEffect, useState } from 'react';
import { z } from 'zod';
import {
  Package,
  Truck,
  MapPin,
  Check,
  RotateCcw,
  SkipForward,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { type PackageInput, type CalculationResult, valueOf } from '../../types/domain';
import { StepHeading, Navigation, ResultNumber, formatKg, Notice } from '../../components/Shared';
import { JourneyMap } from '../../components/Illustrations';
import { ExplainResponseSchema, fallbackExplanation } from '../ai/schemas';

export function JourneyScreen({
  baseline,
  result,
  reduced,
  onBack,
  onNext,
  onSources,
}: {
  baseline: PackageInput;
  result: CalculationResult;
  reduced: boolean;
  onBack: () => void;
  onNext: () => void;
  onSources: () => void;
}) {
  const [stage, setStage] = useState(reduced ? 4 : 0),
    [run, setRun] = useState(0);
  const [explanation, setExplanation] = useState(fallbackExplanation),
    [explainStatus, setExplainStatus] = useState<'idle' | 'loading' | 'fallback' | 'done'>('idle');
  useEffect(() => {
    if (reduced) {
      setStage(4);
      return;
    }
    setStage(0);
    const ids = [1, 2, 3, 4].map((s, i) =>
      setTimeout(() => setStage((current) => Math.max(current, s)), (i + 1) * 1100),
    );
    return () => ids.forEach(clearTimeout);
  }, [run, reduced]);
  useEffect(() => {
    const controller = new AbortController();
    setExplainStatus('loading');
    fetch('/api/ai/explain-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baselineResult: result }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const parsed = ExplainResponseSchema.extend({ fallback: z.boolean().optional() }).parse(
          data,
        );
        setExplanation(parsed);
        setExplainStatus(parsed.fallback ? 'fallback' : 'done');
      })
      .catch(() => {
        if (!controller.signal.aborted) setExplainStatus('fallback');
      });
    const timeout = setTimeout(() => controller.abort(), 25000);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [result]);
  const steps = [
    { icon: Package, label: '包装准备', desc: '看清每一层材料' },
    { icon: Truck, label: '运输途中', desc: '计算距离与分摊' },
    { icon: MapPin, label: '抵达目的地', desc: '收好这段旅程' },
    { icon: Check, label: '发现与比较', desc: '试试一个小改变' },
  ];
  return (
    <>
      <StepHeading
        eyebrow="03 / A LITTLE PACKAGE, A LONG JOURNEY"
        title="跟着包裹，走一程"
        description="从包装到抵达，看看每一部分如何计入演示估算。"
      >
        <span className="route-chip">
          <MapPin size={16} />
          {baseline.route.origin.label || '未知'} → {baseline.route.destination.label || '未知'}
          <strong>{valueOf(baseline.route.distanceKm) ?? '未知'} km</strong>
        </span>
      </StepHeading>
      <div className="journey-layout">
        <section className="card map-card">
          <JourneyMap
            stage={stage}
            reduced={reduced}
            origin={baseline.route.origin.label}
            destination={baseline.route.destination.label}
          />
          <div className="journey-controls">
            <span aria-live="polite">
              {stage === 4
                ? '旅程已抵达，一起看看结果吧。'
                : [
                    '包裹准备出发…',
                    '出发！正在经过运输环节…',
                    '运输贡献已计入…',
                    '包裹已抵达目的地…',
                  ][stage]}
            </span>
            <div>
              <button
                className="text-button"
                onClick={() => {
                  setStage(reduced ? 4 : 0);
                  setRun((v) => v + 1);
                }}
              >
                <RotateCcw size={15} />
                重播
              </button>
              <button className="text-button" disabled={stage === 4} onClick={() => setStage(4)}>
                <SkipForward size={16} />
                跳过动画
              </button>
            </div>
          </div>
          <div className="journey-steps">
            {steps.map((s, i) => (
              <div className={stage >= i + 1 ? 'reached' : ''} key={s.label}>
                <span>
                  <s.icon size={19} />
                </span>
                <strong>{s.label}</strong>
                <small>{s.desc}</small>
              </div>
            ))}
          </div>
        </section>
        <aside className="card result-card">
          <span className="eyebrow">YOUR PACKAGE FOOTPRINT</span>
          <h2>{result.completeness === 'complete' ? '这个包裹的演示估算' : '已覆盖的包裹影响'}</h2>
          {stage >= 4 ? (
            <ResultNumber result={result} />
          ) : (
            <div className="journey-pending" role="status">
              <Package size={27} />
              <strong>正在整理这段旅程…</strong>
              <span>可跳过动画，直接查看全部结果</span>
            </div>
          )}
          <div className="breakdown-bar">
            <span
              style={{
                width: `${result.coveredTotalKgCO2e ? (result.packaging.kgCO2eCovered / result.coveredTotalKgCO2e) * 100 : 50}%`,
              }}
            />
          </div>
          <div className="breakdown-row">
            <span>
              <i className="legend orange" />
              包装材料
            </span>
            <strong>
              {result.packaging.status === 'not_calculable'
                ? '未知'
                : `${formatKg(result.packaging.kgCO2eCovered)} kg`}
            </strong>
          </div>
          <div className="breakdown-row">
            <span>
              <i className="legend blue" />
              去程运输
            </span>
            <strong>
              {stage < 2
                ? '运输途中…'
                : result.transport.status === 'not_calculable'
                  ? '未知'
                  : `${formatKg(result.transport.kgCO2eCovered)} kg`}
            </strong>
          </div>
          <p className="micro-copy">
            均为 kg CO₂e · 仅包装 + 运输
            <br />
            不包含物品本身的制造影响
          </p>
          <button className="source-button" onClick={onSources}>
            <BookOpen size={17} />
            查看计算明细与假设
            <svg viewBox="0 0 20 20" width="16">
              <path d="m7 4 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </aside>
      </div>
      {result.missingFields.length > 0 && (
        <Notice kind="warning">
          <strong>还有 {result.missingFields.length} 项信息待补充。</strong>{' '}
          {result.missingFields.map((m) => m.message).join('；')}
          。这些项目没有被当作零，也没有计入小计。
        </Notice>
      )}
      <div className="explanation-card">
        <span className="icon-tile green">
          <Sparkles size={22} />
        </span>
        <div>
          <h3>
            读懂这个结果{' '}
            <span>{explainStatus === 'done' ? 'AI 辅助解释' : '固定解释 · AI 可选'}</span>
          </h3>
          <p>{explanation.summary}</p>
          <p className="micro-copy">{explanation.caveats.join(' ')}</p>
        </div>
      </div>
      <Navigation back="返回确认" next="试试另一种可能" onBack={onBack} onNext={onNext} />
    </>
  );
}
