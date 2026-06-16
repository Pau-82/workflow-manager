import type { TriggerConditionInput } from '../../../domain/value-objects/trigger-condition.vo.js';
import type { RecipientInput } from '../../../domain/value-objects/recipient.vo.js';

/** Output del caso de uso: DTO plano de primitivos (preserva discriminantes). */
export interface CreateWorkflowOutput {
  id: string;
  name: string;
  isActive: boolean;
  triggerCondition: TriggerConditionInput;
  messageTemplate: string;
  recipients: RecipientInput[];
}
