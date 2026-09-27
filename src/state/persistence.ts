import { z } from 'zod';
import {
  PackageSchema,
  ScenarioSchema,
  ActionPlanSchema,
  type PackageInput,
  type FlowStep,
  type Scenario,
  type ActionPlan,
} from '../types/domain';
import { newPackage } from '../data/demo/package';
import { applyScenario } from '../calculator';
export const STORAGE_KEYS = {
  session: 'pcalc.session.v1',
  action: 'pcalc.actionPlan.v1',
  ui: 'pcalc.ui.v1',
};
export const SessionSchema = z.object({
  version: z.literal(1),
  flowStep: z.enum(['home', 'input', 'confirm', 'journey', 'compare', 'action']),
  packageDraft: PackageSchema,
  baselineSnapshot: PackageSchema.nullable(),
  activeScenario: ScenarioSchema.nullable(),
});
export interface Session {
  version: 1;
  flowStep: FlowStep;
  packageDraft: PackageInput;
  baselineSnapshot: PackageInput | null;
  activeScenario: Scenario | null;
}
export const initialSession = (): Session => ({
  version: 1,
  flowStep: 'home',
  packageDraft: newPackage(),
  baselineSnapshot: null,
  activeScenario: null,
});
export function loadSession(storage: Storage): { session: Session; warning?: string } {
  try {
    const raw = storage.getItem(STORAGE_KEYS.session);
    if (!raw) return { session: initialSession() };
    const session = SessionSchema.parse(JSON.parse(raw));
    if (['journey', 'compare', 'action'].includes(session.flowStep) && !session.baselineSnapshot)
      throw new Error('Missing baseline');
    if (session.baselineSnapshot?.returnScenario) throw new Error('Invalid baseline');
    if (session.activeScenario && !session.baselineSnapshot)
      throw new Error('Missing scenario baseline');
    if (session.activeScenario && session.baselineSnapshot)
      applyScenario(session.baselineSnapshot, session.activeScenario);
    return { session };
  } catch {
    return { session: initialSession(), warning: '上次的本地记录无法读取，已安全恢复到开始页面。' };
  }
}
export function saveSession(storage: Storage, session: Session): boolean {
  try {
    storage.setItem(STORAGE_KEYS.session, JSON.stringify(SessionSchema.parse(session)));
    return true;
  } catch {
    return false;
  }
}
export function loadPlan(storage: Storage): ActionPlan | null {
  try {
    return ActionPlanSchema.parse(JSON.parse(storage.getItem(STORAGE_KEYS.action) ?? 'null'));
  } catch {
    return null;
  }
}
export function savePlan(storage: Storage, plan: ActionPlan): boolean {
  try {
    storage.setItem(STORAGE_KEYS.action, JSON.stringify(ActionPlanSchema.parse(plan)));
    return true;
  } catch {
    return false;
  }
}
export function clearSession(storage: Storage): boolean {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
    return true;
  } catch {
    return false;
  }
}
export function loadMotion(storage: Storage): boolean {
  try {
    return z
      .object({ reducedMotion: z.boolean() })
      .parse(JSON.parse(storage.getItem(STORAGE_KEYS.ui) ?? 'null')).reducedMotion;
  } catch {
    return (
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }
}
export function saveMotion(storage: Storage, reducedMotion: boolean): boolean {
  try {
    storage.setItem(STORAGE_KEYS.ui, JSON.stringify({ reducedMotion }));
    return true;
  } catch {
    return false;
  }
}
