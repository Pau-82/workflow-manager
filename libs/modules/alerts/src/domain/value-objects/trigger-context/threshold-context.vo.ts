import { Result, type LayeredError } from '@org/shared';
import { TriggerContextError } from '../../errors/trigger-context.error.js';

const MAX_METRIC_NAME_LENGTH = 100;

export interface ThresholdContextInput {
  type: 'threshold';
  metricName: string;
  operator: string;
  threshold: number;
  observedValue: number;
}

/** Disparo por umbral: el valor observado cruzó el `threshold` según `operator`. */
export class ThresholdContext {
  readonly type = 'threshold' as const;

  private constructor(
    private readonly _metricName: string,
    private readonly _operator: string,
    private readonly _threshold: number,
    private readonly _observedValue: number,
  ) {}

  static create(
    raw: Omit<ThresholdContextInput, 'type'>,
  ): Result<ThresholdContext, LayeredError> {
    const metricName = (raw.metricName ?? '').trim();
    if (metricName.length === 0) {
      return Result.fail<ThresholdContext>(
        TriggerContextError.emptyMetricName(),
      );
    }
    if (metricName.length > MAX_METRIC_NAME_LENGTH) {
      return Result.fail<ThresholdContext>(
        TriggerContextError.metricNameTooLong(MAX_METRIC_NAME_LENGTH),
      );
    }
    const operator = (raw.operator ?? '').trim();
    if (operator.length === 0) {
      return Result.fail<ThresholdContext>(TriggerContextError.emptyOperator());
    }
    if (!Number.isFinite(raw.threshold)) {
      return Result.fail<ThresholdContext>(
        TriggerContextError.thresholdNotFinite(),
      );
    }
    if (!Number.isFinite(raw.observedValue)) {
      return Result.fail<ThresholdContext>(
        TriggerContextError.observedValueNotFinite(),
      );
    }
    return Result.ok(
      new ThresholdContext(metricName, operator, raw.threshold, raw.observedValue),
    );
  }

  get metricName(): string {
    return this._metricName;
  }
  get operator(): string {
    return this._operator;
  }
  get threshold(): number {
    return this._threshold;
  }
  get observedValue(): number {
    return this._observedValue;
  }
}
