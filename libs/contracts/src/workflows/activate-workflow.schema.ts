import { z } from 'zod';

export const activateWorkflowSchema = z.object({
  id: z.string().min(1),
});

export type ActivateWorkflowInput = z.infer<typeof activateWorkflowSchema>;
