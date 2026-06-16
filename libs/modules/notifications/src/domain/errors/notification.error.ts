import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'Notification';

export const NOTIFICATION_ERRORS = {
  INVALID_CREATED_AT: 'NOTIFICATION_INVALID_CREATED_AT',
  INVALID_COMPOSITION: 'NOTIFICATION_INVALID_COMPOSITION',
} as const;

/** Errores del agregado Notification (layer 'domain'). */
export class NotificationError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static invalidCreatedAt(): NotificationError {
    return NotificationError.of(
      NOTIFICATION_ERRORS.INVALID_CREATED_AT,
      'The createdAt must be a valid date.',
    );
  }

  /**
   * Agrupa todos los errores de construcción/reconstitución sin perder detalle
   * (cada uno queda en metadata.errors). Mismo molde que los otros agregados.
   */
  static invalidComposition(errors: readonly LayeredError[]): NotificationError {
    return NotificationError.of(
      NOTIFICATION_ERRORS.INVALID_COMPOSITION,
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
  ): NotificationError {
    return new NotificationError({
      context: CONTEXT,
      type,
      reason,
      layer: 'domain',
      metadata,
    });
  }
}
