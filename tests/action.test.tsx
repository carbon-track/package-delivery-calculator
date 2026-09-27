// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ActionScreen } from '../src/features/action/ActionScreen';
afterEach(cleanup);
it('a restored action remains visibly saved without a second write', () => {
  render(
    <ActionScreen
      plan={{
        id: 'nearby',
        title: '看看更近的发货地',
        detail: '已保存的行动',
        savedAt: '2026-09-27T00:00:00.000Z',
      }}
      onSave={() => true}
      onBack={() => {}}
      onHome={() => {}}
    />,
  );
  expect(screen.getByRole('button', { name: '行动已保存' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '回到实验室' })).toBeTruthy();
});
