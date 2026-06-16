import { z } from 'zod';
import { createWorkflowSchema } from './create-workflow.schema.js';

/** Update TOTAL: mismos campos que create + id. `isActive` NO va. */
export const updateWorkflowSchema = createWorkflowSchema.extend({
  id: z.string().min(1),
});

export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
