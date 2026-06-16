import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'AlertEvent';

export const ALERT_EVENT_ERRORS = {
  EMPTY_RENDERED_MESSAGE: 'ALERT_EVENT_EMPTY_RENDERED_MESSAGE',
  INVALID_TRIGGERED_AT: 'ALERT_EVENT_INVALID_TRIGGERED_AT',
  INVALID_COMPOSITION: 'ALERT_EVENT_INVALID_COMPOSITION',
} as const;

/**
 * Errores del agregado AlertEvent (layer 'domain'). El estado de resolución (status,
 * fecha, nota) lo valida ahora el VO Resolution; acá quedan los invariantes del resto.
 */
export class AlertEventError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static emptyRenderedMessage(): AlertEventError {
    return AlertEventError.of(
      ALERT_EVENT_ERRORS.EMPTY_RENDERED_MESSAGE,
      'The rendered message cannot be empty.',
    );
  }

  static invalidTriggeredAt(): AlertEventError {
    return AlertEventError.of(
      ALERT_EVENT_ERRORS.INVALID_TRIGGERED_AT,
      'The triggeredAt must be a valid date.',
    );
  }

  /**
   * Agrupa todos los errores de construcción/reconstitución sin perder detalle
   * (cada uno queda en metadata.errors). Mismo molde que Workflow.invalidComposition.
   */
  static invalidComposition(errors: readonly LayeredError[]): AlertEventError {
    return AlertEventError.of(
      ALERT_EVENT_ERRORS.INVALID_COMPOSITION,
      errors.map((error) => error.reason).join(' '),
      {
        errors: errors.map((error) => ({
          context: error.context,
          type: error.type,
          reason: error.reason,
        })),
      },
    );
  }

  private static of(
    type: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ): AlertEventError {
    return new AlertEventError({
      context: CONTEXT,
      type,
      reason,
      layer: 'domain',
      metadata,
    });
  }
}
