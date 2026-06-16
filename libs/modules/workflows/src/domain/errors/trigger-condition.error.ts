import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'TriggerCondition';

export const TRIGGER_CONDITION_ERRORS = {
  EMPTY_METRIC_NAME: 'TRIGGER_CONDITION_EMPTY_METRIC_NAME',
  METRIC_NAME_TOO_LONG: 'TRIGGER_CONDITION_METRIC_NAME_TOO_LONG',
  VALUE_NOT_FINITE: 'TRIGGER_CONDITION_VALUE_NOT_FINITE',
  BASE_VALUE_NOT_FINITE: 'TRIGGER_CONDITION_BASE_VALUE_NOT_FINITE',
  BASE_VALUE_ZERO: 'TRIGGER_CONDITION_BASE_VALUE_ZERO',
  DEVIATION_NOT_POSITIVE: 'TRIGGER_CONDITION_DEVIATION_NOT_POSITIVE',
  DEVIATION_TOO_LARGE: 'TRIGGER_CONDITION_DEVIATION_TOO_LARGE',
  INVALID_DIRECTION: 'TRIGGER_CONDITION_INVALID_DIRECTION',
  UNKNOWN_TYPE: 'TRIGGER_CONDITION_UNKNOWN_TYPE',
} as const;

export class TriggerConditionError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static emptyMetricName(): TriggerConditionError {
    return TriggerConditionError.of(
      TRIGGER_CONDITION_ERRORS.EMPTY_METRIC_NAME,
      'The metric name cannot be empty.',
    );
  }

  static metricNameTooLong(maxLength: number): TriggerConditionError {
    return TriggerConditionError.of(
      TRIGGER_CONDITION_ERRORS.METRIC_NAME_TOO_LONG,
      `The metric name cannot exceed ${maxLength} characters.`,
      { maxLength },
    );
  }

  static valueNotFinite(): TriggerConditionError {
    return TriggerConditionError.of(
      TRIGGER_CONDITION_ERRORS.VALUE_NOT_FINITE,
      'The threshold value must be a finite number.',
    );
  }

  static baseValueNotFinite(): TriggerConditionError {
    return TriggerConditionError.of(
      TRIGGER_CONDITION_ERRORS.BASE_VALUE_NOT_FINITE,
      'The base value must be a finite number.',
    );
  }

  static baseValueZero(): TriggerConditionError {
    return TriggerConditionError.of(
      TRIGGER_CONDITION_ERRORS.BASE_VALUE_ZERO,
      'The base value cannot be zero (division by zero).',
    );
  }

  static deviationNotPositive(): TriggerConditionError {
    return TriggerConditionError.of(
      TRIGGER_CONDITION_ERRORS.DEVIATION_NOT_POSITIVE,
      'The deviation percent must be a finite positive number.',
    );
  }

  static deviationTooLarge(maxPercent: number): TriggerConditionError {
    return TriggerConditionError.of(
      TRIGGER_CONDITION_ERRORS.DEVIATION_TOO_LARGE,
      `The deviation percent cannot exceed ${maxPercent}.`,
      { maxPercent },
    );
  }

  static invalidDirection(value: string, allowed: readonly string[]): TriggerConditionError {
    return TriggerConditionError.of(
      TRIGGER_CONDITION_ERRORS.INVALID_DIRECTION,
      `Invalid variance direction: "${value}".`,
      { value, allowed },
    );
  }

  static unknownType(value: string): TriggerConditionError {
    return TriggerConditionError.of(
      TRIGGER_CONDITION_ERRORS.UNKNOWN_TYPE,
      `Unknown trigger condition type: "${value}".`,
      { value },
    );
  }

  private static of(
    type: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ): TriggerConditionError {
    return new TriggerConditionError({
      context: CONTEXT,
      type,
      reason,
      layer: 'domain',
      metadata,
    });
  }
}
