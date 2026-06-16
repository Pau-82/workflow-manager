import { z } from 'zod';
import { triggerConditionSchema } from './trigger-condition.schema.js';
import { recipientSchema } from './recipient.schema.js';
import { messageTemplateSchema } from './message-template.schema.js';

/** Input de creación. `isActive` NO va: el workflow nace inactivo. */
export const createWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(100),
  triggerCondition: triggerConditionSchema,
  messageTemplate: messageTemplateSchema,
  recipients: z.array(recipientSchema).min(1),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
