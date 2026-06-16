import type { TriggerConditionInput } from '../../../domain/value-objects/trigger-condition.vo.js';
import type { RecipientInput } from '../../../domain/value-objects/recipient.vo.js';

/**
 * DTO plano del workflow (primitivos, preserva los discriminantes de las uniones).
 * Es la representación que cruza la frontera; la comparten los casos de uso que
 * devuelven un workflow (CreateWorkflow, GetWorkflow, ...).
 */
export interface WorkflowDto {
  id: string;
  name: string;
  isActive: boolean;
  triggerCondition: TriggerConditionInput;
  messageTemplate: string;
  recipients: RecipientInput[];
}
