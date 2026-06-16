import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'AlertEvent';

export const ALERT_EVENT_ERRORS = {
  EMPTY_RENDERED_MESSAGE: 'ALERT_EVENT_EMPTY_RENDERED_MESSAGE',
  INVALID_STATUS: 'ALERT_EVENT_INVALID_STATUS',
  INVALID_TRIGGERED_AT: 'ALERT_EVENT_INVALID_TRIGGERED_AT',
  RESOLUTION_NOTE_TOO_LONG: 'ALERT_EVENT_RESOLUTION_NOTE_TOO_LONG',
  INCONSISTENT_RESOLUTION: 'ALERT_EVENT_INCONSISTENT_RESOLUTION',
  INVALID_COMPOSITION: 'ALERT_EVENT_INVALID_COMPOSITION',
} as const;

/** Errores del agregado AlertEvent (layer 'domain'). */
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

  static invalidStatus(value: string, allowed: readonly string[]): AlertEventError {
    return AlertEventError.of(
      ALERT_EVENT_ERRORS.INVALID_STATUS,
      `Invalid alert event status: "${value}".`,
      { value, allowed },
    );
  }

  static invalidTriggeredAt(): AlertEventError {
    return AlertEventError.of(
      ALERT_EVENT_ERRORS.INVALID_TRIGGERED_AT,
      'The triggeredAt must be a valid date.',
    );
  }

  static resolutionNoteTooLong(maxLength: number): AlertEventError {
    return AlertEventError.of(
      ALERT_EVENT_ERRORS.RESOLUTION_NOTE_TOO_LONG,
      `The resolution note cannot exceed ${maxLength} characters.`,
      { maxLength },
    );
  }

  /** El estado y los campos de resolución no son coherentes entre sí. */
  static inconsistentResolution(reason: string): AlertEventError {
    return AlertEventError.of(
      ALERT_EVENT_ERRORS.INCONSISTENT_RESOLUTION,
      reason,
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
