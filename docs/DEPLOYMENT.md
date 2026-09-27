# Cloudflare 部署指南

## 1. 发布基础网站（AI 可不启用）

代码已经配置为 **Cloudflare Workers + Static Assets**，不是 Pages。`/api/*` 优先进入 Worker，其他路径使用静态资源与 SPA 回退。

在本仓库目录运行：

```bash
npm install
npm test
npm run deploy:check
npx wrangler login
npm run deploy
```

`wrangler login` 会打开 Cloudflare 授权页面，请使用你自己的账户完成。`npm run deploy` 会构建并发布 `carbontrack-package-lab`，终端随后给出 `workers.dev` 地址。如名称已被你账户内其他项目使用，请先修改 `wrangler.jsonc` 的 `name`。

首次使用 Workers 时，按 Cloudflare 提示设置账户的 Workers 子域名。无需预先创建数据库、存储桶、KV 或应用密钥。`AI_ENABLED` 保持 `"false"` 时，手动输入、演示、三个情景、本地存储和固定结果解释均可使用。

部署后检查：

- 首页能加载插画与样式。
- `/api/health` 返回 JSON，`ok: true`，`aiEnabled: false`。
- `/methodology` 打开方法说明，其他 SPA 路径返回应用。
- 未知 `/api/` 路径返回 JSON 404，而不是首页 HTML。
- 手机上完整走一遍示例包裹与手动输入。

配置依据：[Cloudflare React + Vite](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)、[SPA 静态路由](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)。

## 2. 可选：启用照片 / 文字 AI 助手

先在账户中启用 Workers AI。当前接口使用：

- 文本与解释：`@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- 图片草稿：`@cf/meta/llama-3.2-11b-vision-instruct`

首次使用视觉模型可能需要你先阅读并接受 Meta 模型许可。按照 [Cloudflare 官方视觉模型指南](https://developers.cloudflare.com/workers-ai/guides/tutorials/llama-vision-tutorial/) 在自己的账户完成；代码不会自动替你接受许可。模型可用性以你账户当前支持情况为准。

修改 `wrangler.jsonc`，保留现有其他字段，将 `vars` 改为以下内容，并新增 `ai`、`ratelimits`：

```jsonc
"vars": { "AI_ENABLED": "true" },
"ai": { "binding": "AI" },
"ratelimits": [
  {
    "name": "AI_RATE_LIMITER",
    "namespace_id": "1001",
    "simple": { "limit": 10, "period": 60 }
  }
]
```

`namespace_id` 选择你账户内专用于本应用的正整数标识；其他服务使用同一 namespace 时会共享计数。此示例限制每个 IP 在单个 Cloudflare 位置每 60 秒 10 次请求。它是宽松的区域限流，不是全球费用硬上限。AI 启用前，按需要在账户侧设置用量监控。参见 [Workers AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/) 与 [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)。

然后重新运行：

```bash
npm run deploy
```

Workers AI binding 使用账户授权，无需把 AI 密钥放进前端。**AI binding、限流 binding、开关必须同时配置，接口才会启用推理**。如仅想本地调试远程推理，可在 `ai` binding 中设置 `"remote": true`，之后运行 `npm run dev`；这种调试会使用真实账户的 AI 配额。测试文本请先用普通包装描述，照片请遮掉个人面单信息。

启用后检查 `/api/health` 的 `aiEnabled: true`，再分别测试文字和图片草稿。确认前不应新增任何组件；确认后重量仍应是未知。应用将图片限制为 JPG/PNG/WebP、2 MB。草稿超时、非法 JSON、无效字段、服务限流都会回退到可继续使用的手动流程。

AI 解释采用严格输出校验与定性文字限制；不通过时使用固定解释。AI 不参与计算、因子选择或基准修改。

## 3. 自定义域名（可选）

基础部署正常后，在 Cloudflare Dashboard → Workers & Pages → `carbontrack-package-lab` → Settings → Domains & Routes 中添加域名，按控制台提示完成 DNS 设置。不需要自定义域名即可先用 `workers.dev` 验证。

## 4. 后续真实数据发布

正式对外提供碳足迹前，需要先选定地区、核验材料与运输因子、确定运输分摊规则并附可查证的文献来源。不要把 `demoOnly` 改为 false 就宣称数据已验证。当前默认数据和界面刻意标为教学演示。

本次开发已完成本地实现与无发布预检；没有登录你的账户或发布线上服务，真实 Workers AI 推理还需要配置后验证。
