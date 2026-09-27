import { useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  Leaf,
  ArrowRight,
  ChevronRight,
  Settings2,
  RotateCcw,
  Check,
  Package,
  Route,
  Layers3,
  Heart,
  Home as HomeIcon,
  Menu,
  MapPin,
  Pencil,
} from 'lucide-react';
import { Home } from './Home';
import { InputScreen, StateChip } from '../features/input/InputScreen';
import { JourneyScreen } from '../features/journey/JourneyScreen';
import { CompareScreen } from '../features/compare/CompareScreen';
import { ActionScreen } from '../features/action/ActionScreen';
import { Modal, Sources, Button, Notice, StepHeading, Navigation } from '../components/Shared';
import { LayersArt } from '../components/Illustrations';
import {
  SessionSchema,
  loadSession,
  initialSession,
  saveSession,
  loadPlan,
  savePlan,
  clearSession,
  loadMotion,
  saveMotion,
} from '../state/persistence';
import { demoPackage, newPackage, dataset } from '../data/demo/package';
import { calculatePackage, applyScenario } from '../calculator';
import {
  PackageSchema,
  ScenarioSchema,
  type FlowStep,
  type PackageInput,
  type ActionPlan,
  type Scenario,
  componentLabels,
  materialLabels,
  valueOf,
  categoryLabels,
} from '../types/domain';
const steps: { step: FlowStep; label: string; icon: typeof Package }[] = [
  { step: 'input', label: '搭建包裹', icon: Package },
  { step: 'confirm', label: '确认分层', icon: Layers3 },
  { step: 'journey', label: '包裹旅程', icon: Route },
  { step: 'compare', label: '情景实验', icon: Leaf },
  { step: 'action', label: '我的行动', icon: Heart },
];
// Browser privacy modes may make even reading localStorage throw.
const fallbackStorage: Storage = {
  length: 0,
  clear() {},
  getItem() {
    return null;
  },
  key() {
    return null;
  },
  removeItem() {
    throw new Error('Storage unavailable');
  },
  setItem() {
    throw new Error('Storage unavailable');
  },
};
function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return fallbackStorage;
  }
}
export default function App() {
  const storage = useMemo(getStorage, []),
    [loaded] = useState(() => loadSession(storage));
  const [session, setSession] = useState(loaded.session),
    [notice, setNotice] = useState(loaded.warning ?? '');
  const [plan, setPlan] = useState(() => loadPlan(storage)),
    [reduced, setReduced] = useState(() => loadMotion(storage));
  const [modal, setModal] = useState<'sources' | 'settings' | 'restart' | null>(
      window.location.pathname === '/methodology' ? 'sources' : null,
    ),
    [pendingMode, setPendingMode] = useState<'demo' | 'user'>('demo');
  const [menuOpen, setMenuOpen] = useState(false);
  const first = useRef(true),
    skipPersist = useRef(false);
  const step = session.flowStep,
    isHome = step === 'home',
    baseline = session.baselineSnapshot;
  const result = useMemo(() => (baseline ? calculatePackage(baseline, dataset) : null), [baseline]);
  const sourceResult = useMemo(() => {
    try {
      return baseline && session.activeScenario
        ? calculatePackage(applyScenario(baseline, session.activeScenario), dataset)
        : (result ?? undefined);
    } catch {
      return result ?? undefined;
    }
  }, [baseline, session.activeScenario, result]);
  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    if (!SessionSchema.safeParse(session).success) return;
    if (!saveSession(storage, session))
      setNotice('当前浏览器无法保存记录，页面仍可使用；关闭或刷新可能丢失进度。');
  }, [session, storage]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [step]);
  const navigate = (flowStep: FlowStep) => {
    setSession((s) => ({ ...s, flowStep }));
    setMenuOpen(false);
    setNotice('');
  };
  const start = (mode: 'demo' | 'user') => {
    setModal(null);
    setNotice('');
    setSession({
      ...initialSession(),
      packageDraft: mode === 'demo' ? structuredClone(demoPackage) : newPackage(),
      flowStep: mode === 'demo' ? 'confirm' : 'input',
    });
  };
  const requestStart = (mode: 'demo' | 'user') => {
    if (baseline || session.packageDraft.components.some((c) => c.massGrams.kind !== 'unknown')) {
      setPendingMode(mode);
      setModal('restart');
    } else start(mode);
  };
  function validateDraft(next: FlowStep) {
    const parsed = PackageSchema.safeParse(session.packageDraft);
    if (!parsed.success) {
      setNotice('请检查输入：重量和距离不能为负，包装件数必须为 1–100 的整数。');
      return;
    }
    setNotice('');
    setSession((s) => ({
      ...s,
      packageDraft: parsed.data,
      flowStep: next,
      ...(next === 'journey'
        ? { baselineSnapshot: structuredClone(parsed.data), activeScenario: null }
        : {}),
    }));
  }
  function saveAction(action: ActionPlan) {
    if (!savePlan(storage, action)) {
      setNotice('未能写入本地存储，请检查浏览器的隐私设置。');
      return false;
    }
    setPlan(action);
    return true;
  }
  const progressIndex = steps.findIndex((s) => s.step === step);
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
      <div className={reduced ? 'app reduced-motion' : 'app'}>
        <a className="skip-link" href="#main">
          跳到主要内容
        </a>
        <header className="site-header">
          <div className="header-inner">
            <button className="brand" onClick={() => navigate('home')} aria-label="包裹实验室首页">
              <img src="/favicon.svg" alt="" />
              <span>
                <strong>包裹实验室</strong>
                <small>CARBONTRACK · PACKAGE LAB</small>
              </span>
            </button>
            <nav className={menuOpen ? 'desktop-nav open' : 'desktop-nav'} aria-label="主导航">
              <button className={isHome ? 'active' : ''} onClick={() => navigate('home')}>
                实验室首页
              </button>
              <button
                className={!isHome ? 'active' : ''}
                onClick={() => (baseline ? navigate('compare') : navigate('input'))}
              >
                探索包裹
              </button>
              <button
                onClick={() => {
                  setModal('sources');
                  setMenuOpen(false);
                }}
              >
                计算方法
                <ArrowRight size={13} />
              </button>
            </nav>
            <div className="header-tools">
              <span className="prototype-label">
                <span className="dot" /> 互动原型
              </span>
              <button
                className="icon-button settings-toggle"
                onClick={() => setModal('settings')}
                aria-label="设置与本地数据"
              >
                <Settings2 size={20} />
              </button>
              <button
                className="icon-button menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="切换导航菜单"
                aria-expanded={menuOpen}
              >
                <Menu size={22} />
              </button>
              <span className="leaf-avatar" aria-hidden="true">
                <Leaf size={23} />
              </span>
            </div>
          </div>
        </header>
        <main id="main" className={isHome ? 'main home-main' : 'main flow-main'}>
          {!isHome && (
            <>
              <div className="flow-top">
                <button className="text-button" onClick={() => navigate('home')}>
                  <HomeIcon size={15} />
                  实验室
                  <ChevronRight size={13} />
                  <span>{steps[progressIndex]?.label}</span>
                </button>
                <span className={`mode-chip ${session.packageDraft.mode}`}>
                  {session.packageDraft.mode === 'demo' ? '示例包裹' : '我的包裹'}
                  <span>·</span>演示因子
                </span>
              </div>
              <nav className="progress-nav" aria-label="包裹探索进度">
                {steps.map((s, i) => (
                  <button
                    key={s.step}
                    aria-current={s.step === step ? 'step' : undefined}
                    disabled={i > 1 && !baseline}
                    className={`${i === progressIndex ? 'current' : ''} ${i < progressIndex ? 'complete' : ''}`}
                    onClick={() => {
                      if (s.step === 'confirm') validateDraft('confirm');
                      else navigate(s.step);
                    }}
                  >
                    <span>{i < progressIndex ? <Check size={16} /> : i + 1}</span>
                    <strong>{s.label}</strong>
                    {i < 4 && <ChevronRight className="progress-chevron" size={16} />}
                  </button>
                ))}
              </nav>
            </>
          )}
          {notice && (
            <div role="alert" className="global-notice">
              <Notice kind="warning">{notice}</Notice>
            </div>
          )}
          {isHome && (
            <Home
              onDemo={() => requestStart('demo')}
              onBuild={() => requestStart('user')}
              onLearn={() => setModal('sources')}
              hasSession={
                !!baseline ||
                session.packageDraft.components.some((c) => c.massGrams.kind !== 'unknown')
              }
              onContinue={() => navigate(baseline ? 'journey' : 'input')}
              plan={plan}
            />
          )}
          {step === 'input' && (
            <InputScreen
              draft={session.packageDraft}
              onChange={(packageDraft: PackageInput) =>
                setSession((s) => ({
                  ...s,
                  packageDraft,
                  baselineSnapshot: null,
                  activeScenario: null,
                }))
              }
              onBack={() => navigate('home')}
              onNext={() => validateDraft('confirm')}
            />
          )}
          {step === 'confirm' && (
            <>
              <StepHeading
                eyebrow="02 / EVERY LAYER HAS A STORY"
                title="打开包裹，看看每一层"
                description="这是你即将计算的包裹。核对一下，准备好就出发。"
              />
              <div className="confirm-layout">
                <section className="card layers-card">
                  <span className="pill">
                    <Layers3 size={15} />
                    包裹分层图
                  </span>
                  <LayersArt components={session.packageDraft.components} />
                  <h2>
                    一份{categoryLabels[session.packageDraft.item.category]}，<br />
                    被认真包裹的心意。
                  </h2>
                  <p>{session.packageDraft.components.length} 层包装 · 示意图不代表真实尺寸</p>
                </section>
                <section className="card confirm-details">
                  <div className="card-heading">
                    <div>
                      <h2>出发前，最后确认一下</h2>
                      <p>模板估计不代表实测，未知字段不会按零处理。</p>
                    </div>
                    <button className="text-button" onClick={() => navigate('input')}>
                      <Pencil size={15} />
                      编辑
                    </button>
                  </div>
                  {session.packageDraft.components.map((c, i) => (
                    <div className="confirm-component" key={c.id}>
                      <span className="component-index">{i + 1}</span>
                      <div>
                        <h3>
                          {componentLabels[c.type]} <small>× {c.quantity}</small>
                        </h3>
                        <p>
                          {materialLabels[valueOf(c.material) ?? 'unknown']}{' '}
                          <StateChip value={c.material} />
                        </p>
                      </div>
                      <div className="mass-confirm">
                        <strong>
                          {valueOf(c.massGrams) ?? '未知'}
                          <small>{valueOf(c.massGrams) !== undefined ? ' g / 件' : ''}</small>
                        </strong>
                        <StateChip value={c.massGrams} />
                      </div>
                    </div>
                  ))}
                  <div className="confirm-route">
                    <MapPin size={20} />
                    <div>
                      <strong>
                        {session.packageDraft.route.origin.label || '发货地未知'}{' '}
                        <ArrowRight size={15} />{' '}
                        {session.packageDraft.route.destination.label || '收货地未知'}
                      </strong>
                      <p>
                        {valueOf(session.packageDraft.route.distanceKm) ?? '未知'} km{' '}
                        <StateChip value={session.packageDraft.route.distanceKm} />
                      </p>
                    </div>
                  </div>
                  <Notice>
                    当前使用教学演示因子。下一步会显示已覆盖部分、缺失信息与所有计算假设。
                  </Notice>
                </section>
              </div>
              <Navigation
                back="返回编辑包裹"
                next="确认包裹，开始旅程"
                onBack={() => navigate('input')}
                onNext={() => validateDraft('journey')}
              />
            </>
          )}
          {step === 'journey' && baseline && result && (
            <JourneyScreen
              baseline={baseline}
              result={result}
              reduced={reduced}
              onBack={() => navigate('confirm')}
              onNext={() => navigate('compare')}
              onSources={() => setModal('sources')}
            />
          )}
          {step === 'compare' && baseline && (
            <CompareScreen
              reduced={reduced}
              baseline={baseline}
              scenario={session.activeScenario}
              onScenario={(scenario: Scenario | null) => {
                const valid = scenario === null || ScenarioSchema.safeParse(scenario).success;
                setSession((s) => ({ ...s, activeScenario: scenario }));
                if (!valid) setNotice('请填写有效的情景参数；修正前不会保存无效数据。');
                else setNotice('');
              }}
              onBack={() => navigate('journey')}
              onNext={() => navigate('action')}
              onSources={() => setModal('sources')}
            />
          )}
          {step === 'action' && (
            <ActionScreen
              plan={plan}
              scenarioType={session.activeScenario?.type}
              onSave={saveAction}
              onBack={() => navigate('compare')}
              onHome={() => navigate('home')}
            />
          )}
        </main>
        <footer className="site-footer">
          <span>
            <Leaf size={17} />
            <strong>小小包裹，也能带来新的发现。</strong>
          </span>
          <div>
            <button onClick={() => setModal('sources')}>方法与数据</button>
            <span>·</span>
            <button onClick={() => setModal('settings')}>隐私与本地记录</button>
            <small>© 2026 CarbonTrack</small>
          </div>
        </footer>
        {!isHome && (
          <nav className="mobile-bottom-nav" aria-label="移动端导航">
            <button onClick={() => navigate('home')}>
              <HomeIcon size={20} />
              <span>首页</span>
            </button>
            {[
              { s: 'input' as const, label: '包裹', icon: Package },
              { s: 'compare' as const, label: '比较', icon: Leaf },
              { s: 'action' as const, label: '行动', icon: Heart },
            ].map((n) => (
              <button
                key={n.s}
                className={step === n.s ? 'active' : ''}
                disabled={n.s !== 'input' && !baseline}
                onClick={() => navigate(n.s)}
              >
                <n.icon size={20} />
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
        )}
        {modal === 'sources' && (
          <Modal title="计算方法、假设与来源" onClose={() => setModal(null)}>
            <Sources result={sourceResult} />
          </Modal>
        )}
        {modal === 'settings' && (
          <Modal title="让实验室更适合你" onClose={() => setModal(null)}>
            <label className="toggle-setting">
              <div>
                <strong>减少动态效果</strong>
                <p>以静态状态呈现旅程，保留所有信息。</p>
              </div>
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => {
                  setReduced(e.target.checked);
                  if (!saveMotion(storage, e.target.checked))
                    setNotice('动态偏好未能保存，但已在当前页面生效。');
                }}
              />
            </label>
            <div className="settings-info">
              <h3>你的数据留在这里</h3>
              <p>
                包裹、情景与行动仅保存在当前浏览器。没有账户、数据库或默认遥测。照片和描述不会写入本地记录。
              </p>
            </div>
            <div className="reset-setting">
              <h3>重新开始</h3>
              <p>清除这台设备上的包裹、已保存行动和显示偏好。</p>
              <Button
                variant="secondary"
                onClick={() => {
                  const cleared = clearSession(storage);
                  skipPersist.current = true;
                  setSession(initialSession());
                  setPlan(null);
                  setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);
                  setModal(null);
                  setNotice(
                    cleared
                      ? '本地包裹、行动与偏好已清除。'
                      : '浏览器阻止了清除记录；当前页面已重置，请在浏览器设置中清除站点数据。',
                  );
                }}
              >
                <RotateCcw size={17} />
                清除本地记录并重置
              </Button>
            </div>
          </Modal>
        )}
        {modal === 'restart' && (
          <Modal title="开启一次新的探索？" onClose={() => setModal(null)}>
            <p>新包裹会替换当前的包裹与对比进度。你已保存的小行动仍会保留。</p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModal(null)}>
                保留当前包裹
              </Button>
              <Button onClick={() => start(pendingMode)}>
                开始新包裹
                <ArrowRight size={17} />
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </MotionConfig>
  );
}
