import { describe, it, expect } from 'vitest';
import { calculatePackage, applyScenario, compareScenario } from '../src/calculator';
import { dataset, demoPackage } from '../src/data/demo/package';
import { FactorDatasetSchema, PackageSchema, known, unknown } from '../src/types/domain';
import { defaultScenario } from '../src/features/compare/CompareScreen';
const base = () => structuredClone(demoPackage);
describe('deterministic calculation', () => {
  it('uses grams → kg, quantity and an explicit material factor', () => {
    const p = base();
    p.components = [{ ...p.components[0], quantity: 2, massGrams: known(500) }];
    const r = calculatePackage(p, dataset);
    expect(r.packaging.kgCO2eCovered).toBeCloseTo(0.8);
    expect(r.packaging.lineItems[0].quantity).toBe(1);
    expect(r.packaging.lineItems[0].sourceRefIds).toEqual(['DEMO-M01']);
  });
  it('computes the reproducible demo fixture', () => {
    const r = calculatePackage(base(), dataset);
    expect(r.packaging.kgCO2eCovered).toBeCloseTo(0.402);
    expect(r.transport.kgCO2eCovered).toBeCloseTo(0.16);
    expect(r.coveredTotalKgCO2e).toBeCloseTo(0.562);
    expect(r.completeness).toBe('complete');
    expect(r.assumptions.some((a) => a.id === 'demo')).toBe(true);
    expect(r.factorDatasetVersion).toBe(dataset.version);
  });
  it('never silently substitutes zero for an unknown mass', () => {
    const p = base();
    p.components[0].massGrams = unknown();
    const r = calculatePackage(p, dataset);
    expect(r.packaging.status).toBe('partial');
    expect(r.completeness).toBe('partial');
    expect(r.missingFields.some((m) => m.fieldPath === 'components.outer.massGrams')).toBe(true);
    expect(r.packaging.lineItems.some((l) => l.id === 'components.outer')).toBe(false);
  });
  it('does not compute an unknown material or route mode', () => {
    const p = base();
    p.components.forEach((c) => (c.material = unknown()));
    p.route.transportMode = unknown();
    const r = calculatePackage(p, dataset);
    expect(r.completeness).toBe('not_calculable');
    expect(r.coveredTotalKgCO2e).toBe(0);
    expect(r.missingFields.length).toBe(5);
  });
  it('distinguishes explicitly known zero from missing distance', () => {
    const p = base();
    p.route.distanceKm = known(0);
    expect(calculatePackage(p, dataset).transport.status).toBe('calculated');
    p.route.distanceKm = unknown();
    expect(calculatePackage(p, dataset).transport.status).toBe('not_calculable');
  });
  it('does not invent shipment mass for tonne-km factors', () => {
    const d = structuredClone(dataset);
    d.transport = [
      {
        ...d.transport[0],
        mode: 'mixed_ground',
        kgCO2ePerParcelKm: undefined,
        kgCO2ePerTonneKm: 0.2,
      },
    ];
    const r = calculatePackage(base(), d);
    expect(r.transport.status).toBe('not_calculable');
    expect(r.missingFields[0].fieldPath).toBe('route.shipmentMass');
  });
  it('allows an explicitly empty set of packaging', () => {
    const p = base();
    p.components = [];
    expect(calculatePackage(p, dataset).packaging).toMatchObject({
      status: 'calculated',
      kgCO2eCovered: 0,
      missingFields: [],
    });
  });
  it('rejects negative inputs, invalid factors and duplicate components', () => {
    const p = base();
    p.components[0].massGrams = known(-2);
    expect(() => calculatePackage(p, dataset)).toThrow();
    const d = structuredClone(dataset);
    d.materials[0].kgCO2ePerKg = -1;
    expect(FactorDatasetSchema.safeParse(d).success).toBe(false);
    const dup = base();
    dup.components.push(dup.components[0]);
    expect(PackageSchema.safeParse(dup).success).toBe(false);
  });
});
describe('single independent scenarios', () => {
  it('adds a separate return trip and extra packaging, without doubling the shipment', () => {
    const p = base();
    const alt = applyScenario(p, {
      type: 'return',
      returnDestination: { label: '苏州' },
      returnDistanceKm: known(100),
      extraPackaging: [{ ...p.components[3], id: 'extra-tape', massGrams: known(20) }],
    });
    const r = compareScenario(p, alt, dataset);
    expect(r.baselineResult.coveredTotalKgCO2e).toBeCloseTo(0.562);
    expect(r.alternativeResult.returnTrip?.kgCO2eCovered).toBeCloseTo(0.124);
    expect(r.alternativeResult.returnTrip?.lineItems).toHaveLength(2);
    expect(r.deltaKgCO2e).toBeCloseTo(0.124);
    expect(alt.route).toEqual(p.route);
  });
  it('keeps the baseline immutable when changing packaging', () => {
    const p = base(),
      before = structuredClone(p);
    Object.freeze(p);
    const alt = applyScenario(p, defaultScenario('less_packaging', p));
    expect(p).toEqual(before);
    expect(alt).not.toBe(p);
    expect(alt.components).not.toBe(p.components);
    expect(alt.route).toEqual(p.route);
    expect(compareScenario(p, alt, dataset).deltaKgCO2e).toBeCloseTo(-0.018);
    alt.components[0].quantity = 10;
    expect(p.components[0].quantity).toBe(1);
  });
  it('changes origin and distance while preserving all other conditions', () => {
    const p = base(),
      alt = applyScenario(p, defaultScenario('closer_origin', p));
    expect(alt.components).toEqual(p.components);
    expect(alt.route.destination).toEqual(p.route.destination);
    expect(compareScenario(p, alt, dataset).deltaKgCO2e).toBeCloseTo(-0.08);
  });
  it('rejects a farther origin, negative scenario and combined scenarios', () => {
    const p = base();
    expect(() =>
      applyScenario(p, {
        type: 'closer_origin',
        alternativeOrigin: { label: '远处' },
        alternativeDistanceKm: known(500),
        assumptionNote: 'test',
      }),
    ).toThrow();
    const alt = applyScenario(p, defaultScenario('return', p));
    alt.components[0].quantity = 5;
    expect(() => compareScenario(p, alt, dataset)).toThrow('每次只能');
    const changed = base();
    changed.route.transportMode = known('truck');
    expect(() => compareScenario(p, changed, dataset)).toThrow();
  });
  it('does not publish a delta for partial or asymmetric coverage', () => {
    const p = base(),
      alt = applyScenario(p, defaultScenario('less_packaging', p));
    alt.components[0].massGrams = unknown();
    const c = compareScenario(p, alt, dataset);
    expect(c.comparisonStatus).toBe('partially_comparable');
    expect(c.deltaKgCO2e).toBeNull();
    const unknownBase = base();
    unknownBase.components.forEach((c) => (c.massGrams = unknown()));
    unknownBase.route.distanceKm = unknown();
    expect(compareScenario(unknownBase, unknownBase, dataset).comparisonStatus).toBe(
      'not_comparable',
    );
  });
  it('reports actual component changes and starts each scenario from baseline', () => {
    const p = base();
    const reduced = applyScenario(p, defaultScenario('less_packaging', p));
    expect(compareScenario(p, reduced, dataset).changedFields[0].fieldPath).toBe(
      'components.filler',
    );
    const returned = applyScenario(p, defaultScenario('return', p));
    expect(returned.components).toEqual(p.components);
  });
});
