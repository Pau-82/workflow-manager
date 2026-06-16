import { z } from 'zod';
import { comparisonOperatorSchema } from './comparison-operator.schema.js';

const finiteNumber = z
  .number()
  .refine((value) => Number.isFinite(value), { message: 'Must be a finite number.' });

export const thresholdTriggerSchema = z.object({
  type: z.literal('threshold'),
  metricName: z.string().trim().min(1).max(100),
  operator: comparisonOperatorSchema,
  value: finiteNumber,
});

export const varianceTriggerSchema = z.object({
  type: z.literal('variance'),
  baseValue: finiteNumber.refine((value) => value !== 0, {
    message: 'Base value cannot be zero.',
  }),
  deviationPercent: finiteNumber.refine(
    (value) => value > 0 && value <= 500,
    { message: 'Deviation percent must be positive and at most 500.' },
  ),
  direction: z.enum(['above', 'below', 'any']),
});

export const triggerConditionSchema = z.discriminatedUnion('type', [
  thresholdTriggerSchema,
  varianceTriggerSchema,
]);
