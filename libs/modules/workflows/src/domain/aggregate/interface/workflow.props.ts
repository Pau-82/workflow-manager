import type { TriggerConditionInput } from '../../value-objects/trigger-condition.vo.js';
import type { RecipientInput } from '../../value-objects/recipient.vo.js';

/** Input crudo para crear un workflow (sin id ni isActive: nace inactivo). */
export interface CreateWorkflowProps {
  name: string;
  triggerCondition: TriggerConditionInput;
  messageTemplate: string;
  recipients: RecipientInput[];
}

/** Snapshot crudo para reconstituir desde persistencia. */
export interface WorkflowPersistenceProps extends CreateWorkflowProps {
  id: string;
  isActive: boolean;
}
