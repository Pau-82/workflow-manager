import { assertNever } from '@org/shared';
import type { Workflow } from '../../../domain/aggregate/workflow.aggregate.js';
import type {
  TriggerCondition,
  TriggerConditionInput,
} from '../../../domain/value-objects/trigger-condition.vo.js';
import type {
  Recipient,
  RecipientInput,
} from '../../../domain/value-objects/recipient.vo.js';
import type { CreateWorkflowOutput } from '../interface/create-workflow.output.dto.js';

/** Mapea el agregado Workflow al DTO de salida de CreateWorkflow (primitivos). */
export class CreateWorkflowMapper {
  static toOutput(workflow: Workflow): CreateWorkflowOutput {
    return {
      id: workflow.id,
      name: workflow.name,
      isActive: workflow.isActive,
      triggerCondition: CreateWorkflowMapper.toConditionDto(
        workflow.triggerCondition,
      ),
      messageTemplate: workflow.messageTemplate.raw,
      recipients: workflow.recipients.map((recipient) =>
        CreateWorkflowMapper.toRecipientDto(recipient),
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
