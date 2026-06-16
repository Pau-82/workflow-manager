import type { TriggerConditionInput } from '../../../domain/value-objects/trigger-condition.vo.js';
import type { RecipientInput } from '../../../domain/value-objects/recipient.vo.js';

/** Input del caso de uso (primitivos; `isActive` no va: nace inactivo). */
export interface CreateWorkflowInput {
  name: string;
  triggerCondition: TriggerConditionInput;
  messageTemplate: string;
  recipients: RecipientInput[];
}
