import { z } from 'zod';

/** Input para simular un disparo: workflow + valor observado (número finito). */
export const simulateTriggerSchema = z.object({
  workflowId: z.string().min(1),
  observedValue: z
    .number()
    .refine((value) => Number.isFinite(value), {
      message: 'observedValue must be a finite number.',
    }),
});

export type SimulateTriggerInput = z.infer<typeof simulateTriggerSchema>;
