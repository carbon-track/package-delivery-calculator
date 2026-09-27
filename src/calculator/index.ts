import {
  PackageSchema,
  FactorDatasetSchema,
  ScenarioSchema,
  componentLabels,
  materialLabels,
  valueOf,
  type PackageInput,
  type PackageComponent,
  type FactorDataset,
  type ModuleResult,
  type ResultLineItem,
  type MissingField,
  type CalculationResult,
  type Scenario,
  type ScenarioComparisonResult,
  type ChangedField,
  type ValueState,
} from '../types/domain';

function moduleResult(
  lineItems: ResultLineItem[],
  missingFields: MissingField[],
  emptyIsKnown = false,
): ModuleResult {
  return {
    status: missingFields.length
      ? lineItems.length
        ? 'partial'
        : 'not_calculable'
      : lineItems.length || emptyIsKnown
        ? 'calculated'
        : 'not_calculable',
    kgCO2eCovered: lineItems.reduce((n, l) => n + l.kgCO2e, 0),
    lineItems,
    missingFields,
  };
}
function packaging(
  components: PackageComponent[],
  dataset: FactorDataset,
  prefix = 'components',
): ModuleResult {
  const lines: ResultLineItem[] = [],
    missing: MissingField[] = [];
  for (const c of components) {
    const mass = valueOf(c.massGrams),
      material = valueOf(c.material);
    const factor = dataset.materials.find(
      (f) => f.material === material && !['unknown', 'other'].includes(f.material),
    );
    if (mass === undefined)
      missing.push({
        fieldPath: `${prefix}.${c.id}.massGrams`,
        message: `${componentLabels[c.type]}的重量未知`,
        blocking: false,
      });
    if (!factor)
      missing.push({
        fieldPath: `${prefix}.${c.id}.material`,
        message: `${componentLabels[c.type]}的材料未知或没有可用因子`,
        blocking: false,
      });
    if (mass !== undefined && factor) {
      const quantity = (mass * c.quantity) / 1000;
      lines.push({
        id: `${prefix}.${c.id}`,
        label: componentLabels[c.type],
        quantity,
        unit: 'kg',
        factorValue: factor.kgCO2ePerKg,
        factorUnit: factor.unit,
        kgCO2e: quantity * factor.kgCO2ePerKg,
        sourceRefIds: [factor.sourceRefId],
      });
    }
  }
  return moduleResult(lines, missing, true);
}
function transport(
  distance: ValueState<number>,
  input: PackageInput,
  dataset: FactorDataset,
  prefix = 'route',
): ModuleResult {
  const missing: MissingField[] = [],
    lines: ResultLineItem[] = [];
  const km = valueOf(distance),
    mode = valueOf(input.route.transportMode);
  const factor = dataset.transport.find((f) => f.mode === mode && f.mode !== 'unknown');
  if (km === undefined)
    missing.push({
      fieldPath: `${prefix}.distanceKm`,
      message: `${prefix === 'route' ? '去程' : '退货'}运输距离未知`,
      blocking: false,
    });
  if (!factor)
    missing.push({
      fieldPath: `${prefix}.transportMode`,
      message: '运输方式未知或缺少对应因子',
      blocking: false,
    });
  // SPEC has no product mass. Tonne-km factors require a new allocation input, not guessed shipment weight.
  if (factor && factor.kgCO2ePerParcelKm === undefined)
    missing.push({
      fieldPath: `${prefix}.shipmentMass`,
      message: '吨公里因子需要完整货物重量，当前数据不足以分摊',
      blocking: false,
    });
  if (km !== undefined && factor?.kgCO2ePerParcelKm !== undefined)
    lines.push({
      id: `${prefix}.transport`,
      label: prefix === 'route' ? '去程运输' : '退货运输',
      quantity: km,
      unit: '包裹·km',
      factorValue: factor.kgCO2ePerParcelKm,
      factorUnit: 'kgCO₂e / 包裹·km',
      kgCO2e: km * factor.kgCO2ePerParcelKm,
      sourceRefIds: [factor.sourceRefId],
    });
  return moduleResult(lines, missing);
}
export function calculatePackage(
  rawInput: PackageInput,
  rawDataset: FactorDataset,
): CalculationResult {
  const input = PackageSchema.parse(rawInput),
    dataset = FactorDatasetSchema.parse(rawDataset);
  const pack = packaging(input.components, dataset),
    outbound = transport(input.route.distanceKm, input, dataset);
  let returnTrip: ModuleResult | undefined;
  if (input.returnScenario) {
    const extra = packaging(
      input.returnScenario.extraPackaging,
      dataset,
      'returnScenario.components',
    );
    const trip = transport(input.returnScenario.returnDistanceKm, input, dataset, 'returnScenario');
    returnTrip = moduleResult(
      [...extra.lineItems, ...trip.lineItems],
      [...extra.missingFields, ...trip.missingFields],
    );
  }
  const modules = [pack, outbound, ...(returnTrip ? [returnTrip] : [])];
  const missingFields = modules.flatMap((m) => m.missingFields);
  const anyCovered = modules.some((m) => m.lineItems.length > 0);
  const assumptions = [
    {
      id: 'scope',
      message: '仅覆盖已知的包装材料与运输；不含商品制造、使用、废弃处理与完整生命周期。',
    },
    {
      id: 'allocation',
      message: '运输采用每包裹每公里固定分摊；改变包装重量不会改变本版运输计算。',
    },
    { id: 'route', message: '地图是解释性示意，不是真实物流追踪；城市名称不会自动推算距离。' },
  ];
  if (dataset.demoOnly)
    assumptions.unshift({
      id: 'demo',
      message:
        '全部因子为人为设置的教学演示系数，未经地区或实测数据验证，不能用于真实碳核算或环保声明。',
    });
  if (JSON.stringify(input).includes('"estimated"'))
    assumptions.push({
      id: 'estimated',
      message: '标为“模板估计”的数据未经测量确认；示例重量与距离来自演示模板。',
    });
  if (returnTrip)
    assumptions.push({
      id: 'return',
      message: '退货与去程使用同一运输方式与分摊规则；退货距离独立填写，新增包装单独计算。',
    });
  return {
    packaging: pack,
    transport: outbound,
    returnTrip,
    coveredTotalKgCO2e: modules.reduce((n, m) => n + m.kgCO2eCovered, 0),
    completeness: missingFields.length ? (anyCovered ? 'partial' : 'not_calculable') : 'complete',
    missingFields,
    assumptions,
    factorDatasetVersion: dataset.version,
    resultVersion: 'calculator-v1.0.0',
  };
}
export function applyScenario(baseline: PackageInput, rawScenario: Scenario): PackageInput {
  const scenario = ScenarioSchema.parse(rawScenario),
    next = structuredClone(PackageSchema.parse(baseline));
  delete next.returnScenario;
  if (scenario.type === 'return')
    next.returnScenario = {
      returnDestination: scenario.returnDestination,
      returnDistanceKm: scenario.returnDistanceKm,
      extraPackaging: scenario.extraPackaging,
    };
  if (scenario.type === 'less_packaging')
    next.components = structuredClone(scenario.replacementComponents);
  if (scenario.type === 'closer_origin') {
    const originalDistance = valueOf(baseline.route.distanceKm),
      alternativeDistance = valueOf(scenario.alternativeDistanceKm);
    if (
      originalDistance !== undefined &&
      alternativeDistance !== undefined &&
      alternativeDistance > originalDistance
    )
      throw new Error('更近产地的距离不能超过原始距离');
    next.route.origin = scenario.alternativeOrigin;
    next.route.distanceKm = scenario.alternativeDistanceKm;
  }
  return PackageSchema.parse(next);
}
function describe(c: PackageComponent | undefined) {
  if (!c) return '无此包装';
  return `${componentLabels[c.type]} · ${materialLabels[valueOf(c.material) ?? 'unknown']} · ${valueOf(c.massGrams) ?? '未知'} g × ${c.quantity}`;
}
export function changedFields(base: PackageInput, alt: PackageInput): ChangedField[] {
  const fields: ChangedField[] = [];
  for (const id of new Set([...base.components, ...alt.components].map((c) => c.id))) {
    const a = base.components.find((c) => c.id === id),
      b = alt.components.find((c) => c.id === id);
    if (JSON.stringify(a) !== JSON.stringify(b))
      fields.push({
        fieldPath: `components.${id}`,
        baselineLabel: describe(a),
        alternativeLabel: describe(b),
      });
  }
  if (JSON.stringify(base.route) !== JSON.stringify(alt.route))
    fields.push({
      fieldPath: 'route',
      baselineLabel: `${base.route.origin.label || '未知产地'} · ${valueOf(base.route.distanceKm) ?? '未知'} km`,
      alternativeLabel: `${alt.route.origin.label || '未知产地'} · ${valueOf(alt.route.distanceKm) ?? '未知'} km`,
    });
  if (alt.returnScenario) {
    fields.push({
      fieldPath: 'returnScenario',
      baselineLabel: '无退货运输',
      alternativeLabel: `退往${alt.returnScenario.returnDestination.label || '未知目的地'} · ${valueOf(alt.returnScenario.returnDistanceKm) ?? '未知'} km`,
    });
    alt.returnScenario.extraPackaging.forEach((c) =>
      fields.push({
        fieldPath: `returnScenario.components.${c.id}`,
        baselineLabel: '无新增包装',
        alternativeLabel: describe(c),
      }),
    );
  }
  return fields;
}
export function compareScenario(
  baselineInput: PackageInput,
  alternativeInput: PackageInput,
  dataset: FactorDataset,
): ScenarioComparisonResult {
  // Reject multi-scenario comparisons at the engine boundary as well as in the UI.
  if (baselineInput.returnScenario) throw new Error('基准不能包含退货情景');
  const componentChanged =
    JSON.stringify(baselineInput.components) !== JSON.stringify(alternativeInput.components);
  const routeChanged =
    JSON.stringify(baselineInput.route) !== JSON.stringify(alternativeInput.route);
  if (
    [componentChanged, routeChanged, !!alternativeInput.returnScenario].filter(Boolean).length > 1
  )
    throw new Error('每次只能比较一个情景');
  const allowed = structuredClone(baselineInput);
  allowed.components = alternativeInput.components;
  allowed.route.origin = alternativeInput.route.origin;
  allowed.route.distanceKm = alternativeInput.route.distanceKm;
  if (alternativeInput.returnScenario) allowed.returnScenario = alternativeInput.returnScenario;
  if (
    JSON.stringify(PackageSchema.parse(allowed)) !==
    JSON.stringify(PackageSchema.parse(alternativeInput))
  )
    throw new Error('情景修改了不允许变动的字段');
  const baselineResult = calculatePackage(baselineInput, dataset),
    alternativeResult = calculatePackage(alternativeInput, dataset);
  const complete =
    baselineResult.completeness === 'complete' && alternativeResult.completeness === 'complete';
  const partial =
    baselineResult.completeness !== 'not_calculable' &&
    alternativeResult.completeness !== 'not_calculable';
  return {
    baselineResult,
    alternativeResult,
    deltaKgCO2e: complete
      ? alternativeResult.coveredTotalKgCO2e - baselineResult.coveredTotalKgCO2e
      : null,
    comparisonStatus: complete ? 'comparable' : partial ? 'partially_comparable' : 'not_comparable',
    changedFields: changedFields(baselineInput, alternativeInput),
    comparisonNotes: complete
      ? ['比较保持其他条件不变；教学演示结果，不代表实际减排。']
      : ['信息覆盖不完整，暂不计算总差值或减排百分比。请先补全缺失字段。'],
  };
}
