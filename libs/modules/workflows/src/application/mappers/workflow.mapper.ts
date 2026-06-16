import { assertNever } from '@org/shared';
import type { Workflow } from '../../domain/aggregate/workflow.aggregate.js';
import type {
  TriggerCondition,
  TriggerConditionInput,
} from '../../domain/value-objects/trigger-condition.vo.js';
import type {
  Recipient,
  RecipientInput,
} from '../../domain/value-objects/recipient.vo.js';
import type { WorkflowDto } from './interface/workflow.dto.js';

/** Mapea el agregado Workflow a su DTO de primitivos. Compartido entre casos de uso. */
export class WorkflowMapper {
  
  static toDto(workflow: Workflow): WorkflowDto {
    return {
      id: workflow.id,
      name: workflow.name,
      isActive: workflow.isActive,
      triggerCondition: WorkflowMapper.toConditionDto(workflow.triggerCondition),
      messageTemplate: workflow.messageTemplate.raw,
      recipients: workflow.recipients.map((recipient) =>
        WorkflowMapper.toRecipientDto(recipient),
      ),
    };
  }

  private static toConditionDto(
    condition: TriggerCondition,
  ): TriggerConditionInput {
    switch (condition.type) {
      case 'threshold':
        return {
          type: 'threshold',
          metricName: condition.metricName,
          operator: condition.operator,
          value: condition.value,
        };
      case 'variance':
        return {
          type: 'variance',
          baseValue: condition.baseValue,
          deviationPercent: condition.deviationPercent,
          direction: condition.direction,
        };
      default:
        return assertNever(condition);
    }
  }

  private static toRecipientDto(recipient: Recipient): RecipientInput {
    return recipient.channel === 'email'
      ? { channel: 'email', address: recipient.address }
      : { channel: 'in-app', target: recipient.target };
  }
}
