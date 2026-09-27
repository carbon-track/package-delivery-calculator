import { z } from 'zod';

export const componentTypes = [
  'shipping_box',
  'product_box',
  'mailer_bag',
  'paper_filler',
  'plastic_filler',
  'tape',
  'label',
  'other',
] as const;
export const materials = [
  'corrugated_cardboard',
  'paper',
  'ldpe_plastic',
  'mixed_plastic',
  'kraft_paper',
  'adhesive_tape',
  'other',
  'unknown',
] as const;
export const transportModes = ['parcel_van', 'truck', 'mixed_ground', 'unknown'] as const;
export const categories = [
  'shoes',
  'clothing',
  'electronics',
  'books',
  'beauty',
  'household',
  'other',
] as const;
export const componentLabels = {
  shipping_box: '快递纸箱',
  product_box: '商品内盒',
  mailer_bag: '快递袋',
  paper_filler: '纸质填充',
  plastic_filler: '塑料缓冲',
  tape: '封箱胶带',
  label: '快递面单',
  other: '其他包装',
};
export const materialLabels = {
  corrugated_cardboard: '瓦楞纸板',
  paper: '普通纸',
  ldpe_plastic: '低密度聚乙烯',
  mixed_plastic: '混合塑料',
  kraft_paper: '牛皮纸',
  adhesive_tape: '胶带',
  other: '其他材料',
  unknown: '暂不确定',
};
export const transportLabels = {
  parcel_van: '配送货车',
  truck: '干线卡车',
  mixed_ground: '陆路混合运输',
  unknown: '暂不确定',
};
export const categoryLabels = {
  shoes: '鞋子',
  clothing: '衣物',
  electronics: '数码产品',
  books: '书籍',
  beauty: '美妆',
  household: '生活用品',
  other: '其他物品',
};
export const valueState = <T extends z.ZodType>(schema: T) =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('known'), value: schema, source: z.literal('user') }),
    z.object({
      kind: z.literal('estimated'),
      value: schema,
      source: z.literal('template'),
      templateId: z.string().min(1),
    }),
    z.object({ kind: z.literal('unknown') }),
  ]);
export type ValueState<T> =
  | { kind: 'known'; value: T; source: 'user' }
  | { kind: 'estimated'; value: T; source: 'template'; templateId: string }
  | { kind: 'unknown' };
export const known = <T>(value: T): ValueState<T> => ({ kind: 'known', value, source: 'user' });
export const estimated = <T>(value: T, templateId = 'demo-package-v1'): ValueState<T> => ({
  kind: 'estimated',
  value,
  source: 'template',
  templateId,
});
export const unknown = <T>(): ValueState<T> => ({ kind: 'unknown' });
export const valueOf = <T>(state: ValueState<T>): T | undefined =>
  state.kind === 'unknown' ? undefined : state.value;
const nonNegative = z.number().finite().min(0);
export const ComponentSchema = z.object({
  id: z.string().min(1),
  layerOrder: z.number().int().min(0),
  type: z.enum(componentTypes),
  material: valueState(z.enum(materials)),
  quantity: z.number().int().min(1).max(100),
  massGrams: valueState(nonNegative.max(100000)),
  isUserEditable: z.boolean(),
  dimensionsCm: valueState(
    z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
  ).optional(),
});
const ComponentsSchema = z
  .array(ComponentSchema)
  .max(30)
  .refine((items) => new Set(items.map((c) => c.id)).size === items.length, '包装部件 ID 不能重复');
export const LocationSchema = z.object({
  label: z.string().max(100),
  city: z.string().optional(),
  countryCode: z.string().optional(),
});
export const DistanceSchema = valueState(nonNegative.max(50000));
export const PackageSchema = z.object({
  id: z.string().min(1),
  mode: z.enum(['demo', 'user']),
  packageContext: z.enum(['received', 'planning_purchase']),
  item: z.object({ category: z.enum(categories) }),
  components: ComponentsSchema,
  route: z.object({
    origin: LocationSchema,
    destination: LocationSchema,
    distanceKm: DistanceSchema,
    transportMode: valueState(z.enum(transportModes)),
  }),
  regionContext: z.object({
    dataRegion: z.enum(['none', 'demo', 'validated_region']),
    factorDatasetVersion: z.string().optional(),
    dataYear: z.number().int().optional(),
  }),
  notes: z.string().max(2000).optional(),
  // Additive extension to SPEC: the outbound route never changes for a return.
  returnScenario: z
    .object({
      returnDestination: LocationSchema,
      returnDistanceKm: DistanceSchema,
      extraPackaging: ComponentsSchema,
    })
    .optional(),
});
export const FactorDatasetSchema = z
  .object({
    version: z.string().min(1),
    region: z.string(),
    year: z.number().int(),
    demoOnly: z.boolean(),
    materials: z.array(
      z.object({
        material: z.enum(materials),
        kgCO2ePerKg: nonNegative,
        unit: z.literal('kgCO2e/kg'),
        sourceRefId: z.string().min(1),
        sourceUrl: z.string().min(1),
        note: z.string().optional(),
      }),
    ),
    transport: z.array(
      z
        .object({
          mode: z.enum(transportModes),
          kgCO2ePerParcelKm: nonNegative.optional(),
          kgCO2ePerTonneKm: nonNegative.optional(),
          allocationMethod: z.string().min(1),
          sourceRefId: z.string().min(1),
          sourceUrl: z.string().min(1),
        })
        .refine(
          (f) => (f.kgCO2ePerParcelKm !== undefined) !== (f.kgCO2ePerTonneKm !== undefined),
          '必须提供且仅提供一种运输因子',
        ),
    ),
  })
  .refine(
    (d) =>
      new Set(d.materials.map((f) => f.material)).size === d.materials.length &&
      new Set(d.transport.map((f) => f.mode)).size === d.transport.length,
    '因子不可重复',
  );
export type PackageInput = z.infer<typeof PackageSchema>;
export type PackageComponent = z.infer<typeof ComponentSchema>;
export type MaterialType = (typeof materials)[number];
export type TransportMode = (typeof transportModes)[number];
export type FactorDataset = z.infer<typeof FactorDatasetSchema>;
export type FlowStep = 'home' | 'input' | 'confirm' | 'journey' | 'compare' | 'action';
export const ScenarioSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('return'),
    returnDestination: LocationSchema,
    returnDistanceKm: DistanceSchema,
    extraPackaging: ComponentsSchema,
  }),
  z.object({
    type: z.literal('less_packaging'),
    replacementComponents: ComponentsSchema,
    protectionConditionNote: z.string().min(1),
  }),
  z.object({
    type: z.literal('closer_origin'),
    alternativeOrigin: LocationSchema,
    alternativeDistanceKm: DistanceSchema,
    assumptionNote: z.string().min(1),
  }),
]);
export type Scenario = z.infer<typeof ScenarioSchema>;
export type ScenarioType = Scenario['type'];
export interface MissingField {
  fieldPath: string;
  message: string;
  blocking: boolean;
}
export interface AssumptionNote {
  id: string;
  message: string;
}
export interface ResultLineItem {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  factorValue: number;
  factorUnit: string;
  kgCO2e: number;
  sourceRefIds: string[];
}
export interface ModuleResult {
  status: 'calculated' | 'partial' | 'not_calculable';
  kgCO2eCovered: number;
  lineItems: ResultLineItem[];
  missingFields: MissingField[];
}
export interface CalculationResult {
  packaging: ModuleResult;
  transport: ModuleResult;
  returnTrip?: ModuleResult;
  coveredTotalKgCO2e: number;
  completeness: 'complete' | 'partial' | 'not_calculable';
  missingFields: MissingField[];
  assumptions: AssumptionNote[];
  factorDatasetVersion: string;
  resultVersion: string;
}
export interface ChangedField {
  fieldPath: string;
  baselineLabel: string;
  alternativeLabel: string;
}
export interface ScenarioComparisonResult {
  baselineResult: CalculationResult;
  alternativeResult: CalculationResult;
  deltaKgCO2e: number | null;
  comparisonStatus: 'comparable' | 'partially_comparable' | 'not_comparable';
  changedFields: ChangedField[];
  comparisonNotes: string[];
}
export const ActionPlanSchema = z.object({
  id: z.string(),
  title: z.string().max(100),
  detail: z.string().max(500),
  savedAt: z.string().datetime(),
});
export type ActionPlan = z.infer<typeof ActionPlanSchema>;
