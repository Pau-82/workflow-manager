import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'TriggerContext';

export const TRIGGER_CONTEXT_ERRORS = {
  EMPTY_METRIC_NAME: 'TRIGGER_CONTEXT_EMPTY_METRIC_NAME',
  METRIC_NAME_TOO_LONG: 'TRIGGER_CONTEXT_METRIC_NAME_TOO_LONG',
  EMPTY_OPERATOR: 'TRIGGER_CONTEXT_EMPTY_OPERATOR',
  THRESHOLD_NOT_FINITE: 'TRIGGER_CONTEXT_THRESHOLD_NOT_FINITE',
  OBSERVED_VALUE_NOT_FINITE: 'TRIGGER_CONTEXT_OBSERVED_VALUE_NOT_FINITE',
  BASE_VALUE_NOT_FINITE: 'TRIGGER_CONTEXT_BASE_VALUE_NOT_FINITE',
  DEVIATION_NOT_FINITE: 'TRIGGER_CONTEXT_DEVIATION_NOT_FINITE',
  ACTUAL_DEVIATION_NOT_FINITE: 'TRIGGER_CONTEXT_ACTUAL_DEVIATION_NOT_FINITE',
  INVALID_DIRECTION: 'TRIGGER_CONTEXT_INVALID_DIRECTION',
  UNKNOWN_TYPE: 'TRIGGER_CONTEXT_UNKNOWN_TYPE',
} as const;

/**
 * Errores de integridad del snapshot TriggerContext (layer 'domain'). El contexto
 * es el registro congelado de un disparo: sólo validamos que sea coherente, no
 * reevaluamos la condición (eso es del TriggerCondition de workflows).
 */
export class TriggerContextError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static emptyMetricName(): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.EMPTY_METRIC_NAME,
      'The metric name cannot be empty.',
    );
  }

  static metricNameTooLong(maxLength: number): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.METRIC_NAME_TOO_LONG,
      `The metric name cannot exceed ${maxLength} characters.`,
      { maxLength },
    );
  }

  static emptyOperator(): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.EMPTY_OPERATOR,
      'The operator cannot be empty.',
    );
  }

  static thresholdNotFinite(): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.THRESHOLD_NOT_FINITE,
      'The threshold must be a finite number.',
    );
  }

  static observedValueNotFinite(): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.OBSERVED_VALUE_NOT_FINITE,
      'The observed value must be a finite number.',
    );
  }

  static baseValueNotFinite(): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.BASE_VALUE_NOT_FINITE,
      'The base value must be a finite number.',
    );
  }

  static deviationNotFinite(): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.DEVIATION_NOT_FINITE,
      'The deviation percent must be a finite number.',
    );
  }

  static actualDeviationNotFinite(): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.ACTUAL_DEVIATION_NOT_FINITE,
      'The actual deviation must be a finite number.',
    );
  }

  static invalidDirection(
    value: string,
    allowed: readonly string[],
  ): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.INVALID_DIRECTION,
      `Invalid variance direction: "${value}".`,
      { value, allowed },
    );
  }

  static unknownType(value: string): TriggerContextError {
    return TriggerContextError.of(
      TRIGGER_CONTEXT_ERRORS.UNKNOWN_TYPE,
      `Unknown trigger context type: "${value}".`,
      { value },
    );
  }

  private static of(
    type: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ): TriggerContextError {
    return new TriggerContextError({
      context: CONTEXT,
      type,
      reason,
      layer: 'domain',
      metadata,
    });
  }
}
