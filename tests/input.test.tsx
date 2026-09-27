// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { InputScreen } from '../src/features/input/InputScreen';
import { newPackage } from '../src/data/demo/package';
const suggestion = {
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
};
function Harness() {
  const [draft, setDraft] = useState(newPackage);
  return <InputScreen draft={draft} onChange={setDraft} onBack={() => {}} onNext={() => {}} />;
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('assisted input remains a confirm-before-write helper', () => {
  it('writes selected suggestions only after explicit approval and leaves mass unknown', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => suggestion }));
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('描述你的包裹'), { target: { value: '牛皮纸填充' } });
    fireEvent.click(screen.getByRole('button', { name: '生成待确认草稿' }));
    await screen.findByText('确认需要添加的包装');
    expect(screen.queryByLabelText('纸质填充单件重量')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '我已核对，添加所选部件' }));
    await waitFor(() =>
      expect((screen.getByLabelText('纸质填充单件重量') as HTMLInputElement).value).toBe(''),
    );
    expect((screen.getByLabelText('描述你的包裹') as HTMLTextAreaElement).value).toBe('');
  });
  it('rejects response fields that could invent carbon values', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ ...suggestion, emissions: 0.9 }) }),
    );
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('描述你的包裹'), { target: { value: '牛皮纸填充' } });
    fireEvent.click(screen.getByRole('button', { name: '生成待确认草稿' }));
    await screen.findByRole('alert');
    expect(screen.queryByLabelText('纸质填充单件重量')).toBeNull();
    expect(screen.getByRole('button', { name: '看看我的包裹' }).hasAttribute('disabled')).toBe(
      false,
    );
  });
});
