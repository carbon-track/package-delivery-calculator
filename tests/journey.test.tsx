// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { JourneyScreen } from '../src/features/journey/JourneyScreen';
import { demoPackage, dataset } from '../src/data/demo/package';
import { calculatePackage } from '../src/calculator';
import { fallbackExplanation } from '../src/features/ai/schemas';
const props = {
  baseline: demoPackage,
  result: calculatePackage(demoPackage, dataset),
  onBack: () => {},
  onNext: () => {},
  onSources: () => {},
};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('journey behavior', () => {
  it('preserves route, breakdown and total in reduced-motion mode', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: async () => ({ ...fallbackExplanation, fallback: true }) }),
    );
    render(<JourneyScreen {...props} reduced />);
    expect(screen.getByText('0.562')).toBeTruthy();
    expect(screen.getByText('包装材料')).toBeTruthy();
    expect(screen.getByText('去程运输')).toBeTruthy();
    expect(screen.getByText('旅程已抵达，一起看看结果吧。')).toBeTruthy();
    expect(screen.getByRole('img', { name: '杭州到上海的解释性路线示意' })).toBeTruthy();
    await act(async () => {});
  });
  it('skip does not resume intermediate stages when old timers fire', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: async () => ({ ...fallbackExplanation, fallback: true }) }),
    );
    render(<JourneyScreen {...props} reduced={false} />);
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }));
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('旅程已抵达，一起看看结果吧。')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '重播' }));
    expect(screen.getByText('包裹准备出发…')).toBeTruthy();
  });
});
