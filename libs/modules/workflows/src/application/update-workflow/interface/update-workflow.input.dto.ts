import type { TriggerConditionInput } from '../../../domain/value-objects/trigger-condition.vo.js';
import type { RecipientInput } from '../../../domain/value-objects/recipient.vo.js';

/** Input del caso de uso (update TOTAL; `isActive` no va: se maneja por activate/deactivate). */
export interface UpdateWorkflowInput {
  id: string;
  name: string;
  triggerCondition: TriggerConditionInput;
  messageTemplate: string;
  recipients: RecipientInput[];
}
