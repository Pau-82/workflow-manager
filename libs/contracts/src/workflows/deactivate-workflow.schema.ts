import { z } from 'zod';

export const deactivateWorkflowSchema = z.object({
  id: z.string().min(1),
});

export type DeactivateWorkflowInput = z.infer<typeof deactivateWorkflowSchema>;
