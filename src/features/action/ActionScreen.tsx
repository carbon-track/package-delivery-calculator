import { useState } from 'react';
import {
  PackageCheck,
  MapPin,
  ClipboardCheck,
  Bookmark,
  Check,
  ArrowLeft,
  ArrowRight,
  Leaf,
} from 'lucide-react';
import { type ActionPlan, type ScenarioType } from '../../types/domain';
import { Button, StepHeading, Notice } from '../../components/Shared';
import { PackageArt } from '../../components/Illustrations';
const actions = [
  {
    id: 'reuse',
    title: '让好包装，再用一次',
    detail: '留下完好的纸箱和填充物。下次寄件前，先检查它们能否继续保护物品。',
    icon: PackageCheck,
    color: 'green',
    tag: '从手边开始',
  },
  {
    id: 'ask',
    title: '下单前，问问包装',
    detail: '向商家询问能否减少重复包装。易碎、易损物品仍要优先保证运输保护。',
    icon: ClipboardCheck,
    color: 'orange',
    tag: '多问一句',
  },
  {
    id: 'nearby',
    title: '看看更近的发货地',
    detail: '在商品和服务条件相同的情况下，查看是否有更近的仓库或发货选项。',
    icon: MapPin,
    color: 'blue',
    tag: '多一个选择',
  },
];
export function ActionScreen({
  plan,
  scenarioType,
  onSave,
  onBack,
  onHome,
}: {
  plan: ActionPlan | null;
  scenarioType?: ScenarioType;
  onSave: (plan: ActionPlan) => boolean;
  onBack: () => void;
  onHome: () => void;
}) {
  const suggested =
    scenarioType === 'closer_origin'
      ? 'nearby'
      : scenarioType === 'less_packaging'
        ? 'ask'
        : 'reuse';
  const [selected, setSelected] = useState(plan?.id ?? suggested);
  const saved = plan?.id === selected;
  const action = actions.find((a) => a.id === selected)!;
  return (
    <>
      <StepHeading
        eyebrow="05 / A LITTLE PLAN FOR NEXT TIME"
        title="把一个小改变，带回生活"
        description="不需要一次做到所有事。挑一个适合你的，下次试试看。"
      />
      <div className="action-hero">
        <div>
          <span className="pill">
            <Leaf size={14} /> 旅程完成，行动刚刚开始
          </span>
          <h2>
            一个包裹。
            <br />
            一个更用心的选择。
          </h2>
          <p>
            认识每一层包装，也认识自己的选择。
            <br />
            不追求完美，从下一次开始。
          </p>
        </div>
        <PackageArt variant="green" />
        <div className="stamp">
          SMALL STEPS
          <br />
          <Leaf size={28} />
          <span>小小行动 · 慢慢发生</span>
        </div>
      </div>
      <div className="action-cards" role="group" aria-label="选择下次的行动">
        {actions.map((a) => (
          <button
            className={`card action-choice ${a.color} ${selected === a.id ? 'selected' : ''}`}
            key={a.id}
            aria-pressed={selected === a.id}
            onClick={() => {
              setSelected(a.id);
            }}
          >
            <div className="action-choice-top">
              <span className={`icon-tile ${a.color}`}>
                <a.icon size={25} />
              </span>
              <span className="radio-indicator">{selected === a.id && <Check size={15} />}</span>
            </div>
            <span className="eyebrow">{a.tag}</span>
            <h3>{a.title}</h3>
            <p>{a.detail}</p>
            {suggested === a.id && <span className="recommendation">与你的探索有关</span>}
          </button>
        ))}
      </div>
      <div className="save-plan card">
        <div>
          <Bookmark size={22} />
          <div>
            <h3>{saved ? '已存好，留给下一次的你' : '保存到这台设备'}</h3>
            <p>{saved ? action.title : '无需登录，下次打开还能看见。清除浏览器数据会移除记录。'}</p>
          </div>
        </div>
        <Button
          onClick={() => {
            onSave({
              id: action.id,
              title: action.title,
              detail: action.detail,
              savedAt: new Date().toISOString(),
            });
          }}
        >
          {saved ? <Check size={18} /> : <Bookmark size={18} />}
          {saved ? '行动已保存' : '保存我的小行动'}
        </Button>
      </div>
      {saved && (
        <div role="status">
          <Notice kind="success">你的行动已保存在当前浏览器。谢谢你认真看完这个包裹的旅程。</Notice>
        </div>
      )}
      <div className="flow-navigation">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={17} />
          继续比较
        </Button>
        <Button variant="ghost" onClick={onHome}>
          {saved ? '回到实验室' : '这次先不保存'}
          <ArrowRight size={17} />
        </Button>
      </div>
    </>
  );
}
