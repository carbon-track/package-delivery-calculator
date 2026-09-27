# 包裹实验室 · CarbonTrack

一个 mobile-first 包裹碳旅程互动原型。基于 [工程 SPEC](docs/SPEC.md) 与 [视觉说明](docs/DESIGN_BRIEF.md) 实现。

> 当前所有排放因子都是明确标注的教学演示数据，**不代表真实地区的碳足迹**。输入真实包裹也不会改变这一数据边界。

## 本地启动

Node.js **22.12+**（建议当前 LTS），npm。

```bash
npm install
npm run dev
```

打开终端显示的地址，默认 `http://127.0.0.1:5173`。Vite 与 Cloudflare Worker 在同一开发服务器运行。不需要 Cloudflare 登录即可体验手动流程与 AI 回退。AI 默认关闭。

## 已实现

- 中文、响应式六步流程：首页 → 搭建 → 确认 → 旅程 → 对比 → 行动。
- 示例包裹与手动输入；部件、材料、数量、单件重量、产地、距离、运输方式可编辑。
- 照片 / 短描述辅助草稿界面与 Worker 接口；草稿需明确确认才写入，重量保留未知。
- 包裹分层 SVG、解释性运输动画、跳过 / 重播、系统与手动减少动态效果。
- 纯 TypeScript 计算内核；可追溯明细、版本、假设和缺失覆盖。
- 独立退货、减少包装、更近产地情景；原始包裹固定，可恢复原始状态。
- 保存一个行动；localStorage 会话恢复、坏数据恢复、定向清除本应用记录。
- 无登录、无数据库、无图片永久存储、默认无遥测。

## 验证命令

```bash
npm test                # 单元、接口与组件行为测试
npm run build          # TypeScript 检查 + 前端/Worker 构建
npm run deploy:check   # 构建 + Cloudflare 无发布预检
npm run test:e2e       # Playwright 桌面/移动冒烟用例（需要本机 Google Chrome）
```

Playwright 使用独立上下文与临时输出目录。首次未安装 Chrome 的环境可自行安装 Chrome，或将 `playwright.config.ts` 的 `channel` 去掉并用 `npx playwright install chromium` 安装测试浏览器。当前实现验收与已实际执行的检查见 [验收记录](docs/implementation/VERIFICATION.md)。

## 项目结构

```text
src/app/                 页面编排、首页
src/calculator/          与 React 无关的确定性计算与情景比较
src/types/               TypeScript 领域类型、Zod 运行时校验
src/data/                演示包裹与版本化因子
src/features/            输入、AI、旅程、对比、行动
src/components/          可复用控件、SVG、来源面板
src/state/               本地存储边界
worker/index.ts          Worker HTTP、AI 校验、限流与失败回退
public/                  原创插画、favicon、安全响应头
```

## 计算规则与实现决策

- 包装：`单件克重 / 1000 × 件数 × kgCO₂e/kg`。
- 运输：`距离 × kgCO₂e/包裹·km`。本版每包裹固定分摊；改变包装重量不影响运输计算。
- SPEC 未定义完整货物重量，吨公里因子不可凭空分摊，内核会报告缺失重量。
- 退货：在 `PackageInput` 上扩展可选 `returnScenario`，独立记录退货目的地、距离和新增包装。去程不变，不把原结果乘二。
- 如果任一结果覆盖不完整，保留两侧已覆盖小计，**不发布总差值或减排百分比**。
- “模型内覆盖完整”只表示已填写此简化模型所需的信息，不表示完整生命周期核算或数据已实证验证。
- 会话保存输入快照与情景参数，结果在恢复时重新计算，不持久化可能过期的派生数字。
- 构建设置 `emptyOutDir: false`，遵守仓库禁止批量删除的规则。需要移除旧构建文件时由维护者手动处理。

## Cloudflare 与 AI

- 线上地址：[https://package.carbontrackapp.com](https://package.carbontrackapp.com)
- 健康检查：[https://package.carbontrackapp.com/api/health](https://package.carbontrackapp.com/api/health)

[部署与可选 AI 配置](docs/DEPLOYMENT.md) 包含从登录到发布的完整步骤。基础网站无需 API key、D1、KV 或 R2；AI 可稍后通过 Workers AI binding 开启。

[后续任务](docs/TASKS.md) · [插画来源与生成记录](docs/implementation/ASSETS.md)
