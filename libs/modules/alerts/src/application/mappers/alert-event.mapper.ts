import { assertNever } from '@org/shared';
import type { AlertEvent } from '../../domain/aggregate/alert-event.aggregate.js';
import type {
  TriggerContext,
  TriggerContextInput,
} from '../../domain/value-objects/trigger-context/trigger-context.vo.js';
import type { AlertEventDto } from './interface/alert-event.dto.js';

/** Mapea el agregado AlertEvent a su DTO de primitivos. Compartido entre casos de uso. */
export class AlertEventMapper {

  static toDto(event: AlertEvent): AlertEventDto {
    return {
      id: event.id,
      workflowId: event.workflowId,
      triggeredAt: event.triggeredAt.toISOString(),
      triggerContext: AlertEventMapper.toContextDto(event.triggerContext),
      renderedMessage: event.renderedMessage,
      status: event.status,
      resolvedAt: event.resolvedAt ? event.resolvedAt.toISOString() : null,
      resolutionNote: event.resolutionNote,
    };
  }

  private static toContextDto(context: TriggerContext): TriggerContextInput {
    switch (context.type) {
      case 'threshold':
        return {
          type: 'threshold',
          metricName: context.metricName,
          operator: context.operator,
          threshold: context.threshold,
          observedValue: context.observedValue,
        };
      case 'variance':
        return {
          type: 'variance',
          baseValue: context.baseValue,
          deviationPercent: context.deviationPercent,
          direction: context.direction,
          observedValue: context.observedValue,
          actualDeviation: context.actualDeviation,
        };
      default:
        return assertNever(context);
    }
  }
}
