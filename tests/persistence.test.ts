import { describe, it, expect } from 'vitest';
import {
  loadSession,
  saveSession,
  initialSession,
  clearSession,
  loadPlan,
  savePlan,
  STORAGE_KEYS,
} from '../src/state/persistence';
import { demoPackage } from '../src/data/demo/package';
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    key(i) {
      return [...map.keys()][i] ?? null;
    },
    getItem(k) {
      return map.get(k) ?? null;
    },
    setItem(k, v) {
      map.set(k, v);
    },
    removeItem(k) {
      map.delete(k);
    },
  };
}
describe('local persistence', () => {
  it('round trips the state without caching derived emissions', () => {
    const s = memoryStorage(),
      state = {
        ...initialSession(),
        packageDraft: demoPackage,
        baselineSnapshot: demoPackage,
        flowStep: 'journey' as const,
      };
    expect(saveSession(s, state)).toBe(true);
    expect(loadSession(s).session).toEqual(state);
    expect(s.getItem(STORAGE_KEYS.session)).not.toContain('coveredTotalKgCO2e');
  });
  it('recovers malformed JSON and impossible flow states', () => {
    const s = memoryStorage();
    s.setItem(STORAGE_KEYS.session, '{bad');
    expect(loadSession(s).warning).toBeTruthy();
    s.setItem(STORAGE_KEYS.session, JSON.stringify({ ...initialSession(), flowStep: 'compare' }));
    expect(loadSession(s).session.flowStep).toBe('home');
  });
  it('clears only app-owned keys, including the action and motion setting', () => {
    const s = memoryStorage();
    s.setItem('another-app', 'keep');
    saveSession(s, initialSession());
    savePlan(s, { id: 'reuse', title: '复用', detail: '纸箱', savedAt: new Date().toISOString() });
    s.setItem(STORAGE_KEYS.ui, '{}');
    expect(loadPlan(s)?.id).toBe('reuse');
    expect(clearSession(s)).toBe(true);
    expect(s.length).toBe(1);
    expect(s.getItem('another-app')).toBe('keep');
  });
  it('handles storage unavailability without crashing', () => {
    const s = memoryStorage();
    s.setItem = () => {
      throw new Error('quota');
    };
    expect(saveSession(s, initialSession())).toBe(false);
  });
});
