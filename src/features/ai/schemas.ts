import { z } from 'zod';
import { componentTypes, materials } from '../../types/domain';
export const DraftRequestSchema = z
  .strictObject({
    text: z.string().trim().max(1000).optional(),
    imageBase64: z
      .string()
      .max(2800000)
      .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/)
      .optional(),
  })
  .refine((r) => !!r.text || !!r.imageBase64, '请描述包裹或选择图片');
export const DraftResponseSchema = z.strictObject({
  components: z
    .array(
      z.strictObject({
        type: z.enum([...componentTypes, 'unknown']),
        material: z.enum(materials),
        quantity: z.number().int().min(1).max(100).nullable(),
        confidence: z.number().min(0).max(1).nullable(),
        inferredFrom: z.enum(['text', 'image', 'both']),
      }),
    )
    .max(20),
  draftWarnings: z.array(z.string().max(300)).max(10),
  unknownFields: z.array(z.string().max(100)).max(30),
});
const MissingSchema = z.object({
  fieldPath: z.string().max(200),
  message: z.string().max(300),
  blocking: z.boolean(),
});
const LineSchema = z.object({
  id: z.string().max(200),
  label: z.string().max(100),
  quantity: z.number().finite().nonnegative(),
  unit: z.string().max(100),
  factorValue: z.number().finite().nonnegative(),
  factorUnit: z.string().max(100),
  kgCO2e: z.number().finite().nonnegative(),
  sourceRefIds: z.array(z.string().max(100)).max(10),
});
const ModuleSchema = z.object({
  status: z.enum(['calculated', 'partial', 'not_calculable']),
  kgCO2eCovered: z.number().finite().nonnegative(),
  lineItems: z.array(LineSchema).max(60),
  missingFields: z.array(MissingSchema).max(100),
});
export const ResultSchema = z.object({
  packaging: ModuleSchema,
  transport: ModuleSchema,
  returnTrip: ModuleSchema.optional(),
  coveredTotalKgCO2e: z.number().finite().nonnegative(),
  completeness: z.enum(['complete', 'partial', 'not_calculable']),
  missingFields: z.array(MissingSchema).max(100),
  assumptions: z.array(z.object({ id: z.string().max(100), message: z.string().max(500) })).max(20),
  factorDatasetVersion: z.string().max(100),
  resultVersion: z.string().max(100),
});
export const ExplainRequestSchema = z.object({
  baselineResult: ResultSchema,
  comparisonResult: z
    .object({
      baselineResult: ResultSchema,
      alternativeResult: ResultSchema,
      deltaKgCO2e: z.number().finite().nullable(),
      comparisonStatus: z.enum(['comparable', 'partially_comparable', 'not_comparable']),
      changedFields: z
        .array(
          z.object({
            fieldPath: z.string(),
            baselineLabel: z.string(),
            alternativeLabel: z.string(),
          }),
        )
        .max(60),
      comparisonNotes: z.array(z.string()).max(20),
    })
    .optional(),
  currentScenarioType: z.enum(['return', 'less_packaging', 'closer_origin']).optional(),
  userConstraints: z
    .object({
      timeSensitivity: z.string().max(200).optional(),
      transportAccess: z.string().max(200).optional(),
    })
    .optional(),
});
export const ExplainResponseSchema = z.strictObject({
  summary: z.string().min(1).max(500),
  suggestionCards: z
    .array(
      z.strictObject({
        id: z.string().max(100),
        title: z.string().max(100),
        detail: z.string().max(300),
      }),
    )
    .max(3),
  caveats: z.array(z.string().max(300)).max(5),
});
export type DraftResponse = z.infer<typeof DraftResponseSchema>;
export const fallbackExplanation = {
  summary:
    '包装由材料重量与对应系数计算，运输由距离与每包裹分摊系数计算。先看清已覆盖的部分，再比较一个具体改变。',
  suggestionCards: [
    {
      id: 'reuse',
      title: '留下完好的包装',
      detail: '保留纸箱和填充物，在保护物品的前提下留待下次使用。',
    },
  ],
  caveats: [
    '当前使用教学演示系数，结果不代表真实碳足迹。',
    '未知项目没有计入已覆盖小计；补全资料后再比较总量。',
  ],
};
