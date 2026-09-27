import {
  ArrowRight,
  Play,
  Package,
  Layers3,
  Route,
  Leaf,
  Clock3,
  ShieldCheck,
  Check,
  Bookmark,
  Undo2,
  PackageMinus,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/Shared';
import { PackageArt } from '../components/Illustrations';
import type { ActionPlan } from '../types/domain';
export function Home({
  onDemo,
  onBuild,
  onLearn,
  onContinue,
  hasSession,
  plan,
}: {
  onDemo: () => void;
  onBuild: () => void;
  onLearn: () => void;
  onContinue: () => void;
  hasSession: boolean;
  plan: ActionPlan | null;
}) {
  return (
    <>
      <section className="home-hero">
        <img
          className="hero-image"
          src="/package-world.png"
          alt="一辆运送包裹的小车，穿过绿色海岛与木桥，驶向温暖的小屋"
          fetchPriority="high"
        />
        <div className="hero-scrim" />
        <div className="hero-content">
          <span className="pill">
            <span className="dot" /> 欢迎来到包裹实验室
          </span>
          <h1 tabIndex={-1}>
            小小包裹，
            <br />
            也有自己的
            <span>
              碳旅程
              <span className="title-leaf">
                <Leaf size={34} />
              </span>
            </span>
          </h1>
          <p>
            拆开每一层包装，跟随每一段旅程。
            <br />
            一起发现，下次可以做的小小改变。
          </p>
          <div className="hero-actions">
            <Button onClick={onDemo}>
              <Play size={17} fill="currentColor" />
              探索示例包裹
              <ArrowRight size={18} />
            </Button>
            <Button variant="secondary" onClick={onBuild}>
              搭建我的包裹
              <PlusIcon />
            </Button>
          </div>
          <div className="hero-meta">
            <span>
              <Clock3 size={14} />约 3 分钟
            </span>
            <span>
              <ShieldCheck size={14} />
              无需登录
            </span>
            <span>
              <Check size={14} />
              不确定也可以开始
            </span>
          </div>
        </div>
        <div className="hero-postcard">
          <span className="icon-tile green">
            <Leaf size={23} />
          </span>
          <div>
            <strong>每个选择，都值得被看见</strong>
            <small>从一个包裹，开始一次发现</small>
          </div>
        </div>
        <span className="hero-coordinate">THE PACKAGE LAB · EST. 2026</span>
      </section>
      {hasSession && (
        <div className="resume-strip">
          <span>
            <Package size={20} />
            你的包裹还在这里，接着上次的探索吧。
          </span>
          <button className="text-button" onClick={onContinue}>
            继续上次旅程
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <section className="home-how" id="how-it-works">
        <div className="section-title">
          <div>
            <span className="eyebrow">A SMALL ADVENTURE IN FOUR STEPS</span>
            <h2>一个包裹，四站发现</h2>
          </div>
          <span>
            从好奇开始，让改变发生 <Leaf size={17} />
          </span>
        </div>
        <div className="home-steps">
          <button className="home-step" onClick={onBuild}>
            <div className="home-step-top">
              <span className="step-badge orange">01</span>
              <ArrowRight size={18} />
            </div>
            <PackageArt />
            <h3>搭建你的包裹</h3>
            <p>
              手动填写、拍张照片，
              <br />
              或者简单描述一下。
            </p>
            <span className="step-link">
              从这里出发 <ChevronRight size={15} />
            </span>
          </button>
          <button className="home-step" onClick={onDemo}>
            <div className="home-step-top">
              <span className="step-badge green">02</span>
              <Layers3 size={20} />
            </div>
            <div className="home-layer-art">
              <span />
              <span />
              <span />
            </div>
            <h3>看见每一层包装</h3>
            <p>
              纸箱、填充物、胶带……
              <br />
              每一层，都有它的角色。
            </p>
            <span className="step-link">
              打开示例看看 <ChevronRight size={15} />
            </span>
          </button>
          <button className="home-step" onClick={onDemo}>
            <div className="home-step-top">
              <span className="step-badge blue">03</span>
              <Route size={20} />
            </div>
            <div className="home-route-art">
              <span className="route-cloud">
                CO₂<span>e</span>
              </span>
              <svg viewBox="0 0 180 60">
                <path
                  d="M5 43Q50-8 88 33T174 20"
                  fill="none"
                  stroke="#86bab9"
                  strokeWidth="3"
                  strokeDasharray="5 6"
                />
                <circle cx="9" cy="39" r="7" fill="#5c9c65" />
                <circle cx="173" cy="20" r="7" fill="#dcad60" />
              </svg>
            </div>
            <h3>跟随包裹的旅程</h3>
            <p>
              从出发到抵达，了解
              <br />
              包装与运输各自的影响。
            </p>
            <span className="step-link">
              让影响变得可见 <ChevronRight size={15} />
            </span>
          </button>
          <button className="home-step possibilities" onClick={onDemo}>
            <div className="home-step-top">
              <span className="step-badge orange">04</span>
              <Leaf size={20} />
            </div>
            <div className="mini-scenarios">
              <span className="orange">
                <Undo2 size={19} />
                如果我退货
                <ChevronRight size={16} />
              </span>
              <span className="green">
                <PackageMinus size={19} />
                少一点包装
                <ChevronRight size={16} />
              </span>
              <span className="blue">
                <MapPin size={19} />
                从更近处出发
                <ChevronRight size={16} />
              </span>
            </div>
            <h3>试试另一种可能</h3>
            <p>
              每次改变一件事，
              <br />
              带走一个下次的小行动。
            </p>
            <span className="step-link">
              发现你的选择 <ChevronRight size={15} />
            </span>
          </button>
        </div>
      </section>
      <section className="home-bottom">
        <div className="honesty-card">
          <span className="icon-tile sand">
            <ShieldCheck size={24} />
          </span>
          <div>
            <h3>有依据，也有边界</h3>
            <p>
              当前是教学演示原型。我们会展示计算方法、假设与未知项，
              <br className="desktop-only" />
              不把示例估算当作真实碳足迹。
            </p>
          </div>
          <button className="text-button" onClick={onLearn}>
            了解计算方式
            <ArrowRight size={16} />
          </button>
        </div>
        {plan && (
          <div className="saved-home">
            <Bookmark size={21} />
            <div>
              <small>留给下一次的自己</small>
              <strong>{plan.title}</strong>
              <p>{plan.detail}</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
function PlusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
