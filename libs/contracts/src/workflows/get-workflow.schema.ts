import { z } from 'zod';

export const getWorkflowSchema = z.object({
  id: z.string().min(1),
});

export type GetWorkflowInput = z.infer<typeof getWorkflowSchema>;
