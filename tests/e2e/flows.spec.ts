import { test, expect, type Page } from '@playwright/test';
async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '探索示例包裹', exact: true }).click();
  await page.getByRole('button', { name: '确认包裹，开始旅程', exact: true }).click();
  await page.getByRole('button', { name: '跳过动画', exact: true }).click();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}
test('demo → three independent comparisons → saved action → reload', async ({ page }) => {
  await demo(page);
  await expect(page.getByText('0.562', { exact: true })).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button', { name: '试试另一种可能', exact: true }).click();
  await page.getByRole('button', { name: /^少一点包装/ }).click();
  await expect(page.getByText('-0.018 kg CO₂e', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^如果我退货/ }).click();
  await page.getByLabel('退货运输距离', { exact: true }).fill('100');
  await expect(page.getByText('+0.080 kg CO₂e', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^从更近处出发/ }).click();
  await expect(page.getByText('-0.080 kg CO₂e', { exact: true })).toBeVisible();
  await noOverflow(page);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: '从更近处出发 · 情景设置', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '恢复原始包裹', exact: true }).click();
  await expect(page.getByText('选一个情景试试看', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '带走一个小行动', exact: true }).click();
  await page.getByRole('button', { name: '保存我的小行动', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '行动已保存', exact: true })).toBeVisible();
});
test('manual entry remains available when AI is disabled', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '搭建我的包裹', exact: true }).click();
  await page
    .getByRole('combobox', { name: '材料 暂不确定', exact: true })
    .selectOption('corrugated_cardboard');
  await page.getByLabel('快递纸箱单件重量', { exact: true }).fill('500');
  await page.getByLabel('运输距离', { exact: true }).fill('200');
  await page
    .getByRole('combobox', { name: '运输方式 暂不确定', exact: true })
    .selectOption('mixed_ground');
  await page.getByLabel('描述你的包裹', { exact: true }).fill('纸箱里有牛皮纸');
  await page.getByRole('button', { name: '生成待确认草稿', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('AI 助手尚未启用');
  await page.getByRole('button', { name: '看看我的包裹', exact: true }).click();
  await page.getByRole('button', { name: '确认包裹，开始旅程', exact: true }).click();
  await page.getByRole('button', { name: '跳过动画', exact: true }).click();
  await expect(page.getByText('0.560', { exact: true })).toBeVisible();
});
test('unknown data remains visible and reduced-motion preference survives refresh', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: '设置与本地数据', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await page.getByRole('button', { name: '搭建我的包裹', exact: true }).click();
  await page.getByRole('button', { name: '看看我的包裹', exact: true }).click();
  await page.getByRole('button', { name: '确认包裹，开始旅程', exact: true }).click();
  await expect(page.getByText('信息不足 · 暂不可计算', { exact: true })).toBeVisible();
  await expect(page.getByText('旅程已抵达，一起看看结果吧。', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('旅程已抵达，一起看看结果吧。', { exact: true })).toBeVisible();
});
test('reset removes only this application’s local records', async ({ page }) => {
  await demo(page);
  await page.getByRole('button', { name: '设置与本地数据', exact: true }).click();
  await page.getByRole('button', { name: '清除本地记录并重置', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('小小包裹');
  expect(
    await page.evaluate(() =>
      ['pcalc.session.v1', 'pcalc.actionPlan.v1', 'pcalc.ui.v1'].map((k) =>
        localStorage.getItem(k),
      ),
    ),
  ).toEqual([null, null, null]);
});
test('AI suggestions require explicit confirmation and do not include guessed mass', async ({
  page,
}) => {
  await page.route('**/api/ai/package-draft', (route) =>
    route.fulfill({
      json: {
        components: [
          {
            type: 'paper_filler',
            material: 'kraft_paper',
            quantity: 1,
            confidence: 0.8,
            inferredFrom: 'text',
          },
        ],
        draftWarnings: ['请核对材料'],
        unknownFields: ['massGrams'],
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: '搭建我的包裹', exact: true }).click();
  await page.getByLabel('描述你的包裹', { exact: true }).fill('牛皮纸填充');
  await page.getByRole('button', { name: '生成待确认草稿', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '确认需要添加的包装', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('纸质填充单件重量', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '我已核对，添加所选部件', exact: true }).click();
  await expect(page.getByLabel('纸质填充单件重量', { exact: true })).toHaveValue('');
});
