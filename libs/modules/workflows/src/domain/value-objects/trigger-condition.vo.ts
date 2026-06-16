import { Result, assertNever, type LayeredError } from '@org/shared';
import { TriggerConditionError } from '../errors/trigger-condition.error.js';
import { ComparisonOperator } from './comparison-operator.vo.js';

const MAX_METRIC_NAME_LENGTH = 100;
const MAX_DEVIATION_PERCENT = 500;

export const TRIGGER_DIRECTIONS = ['above', 'below', 'any'] as const;
export type TriggerDirection = (typeof TRIGGER_DIRECTIONS)[number];

export interface ThresholdConditionInput {
  type: 'threshold';
  metricName: string;
  operator: string;
  value: number;
}
export interface VarianceConditionInput {
  type: 'variance';
  baseValue: number;
  deviationPercent: number;
  direction: string;
}
export type TriggerConditionInput =
  | ThresholdConditionInput
  | VarianceConditionInput;

/**
 * Snapshot CONGELADO del disparo (lo que se guarda en el AlertEvent). Shape
 * deliberadamente IGUAL al `TriggerContextInput` de alerts: workflows produce el
 * dato (Ley de Demeter) sin depender de alerts; el handler lo pasa a
 * `TriggerContext.create`. La compatibilidad es estructural.
 */
export interface ThresholdContextSnapshot {
  type: 'threshold';
  metricName: string;
  operator: string;
  threshold: number;
  observedValue: number;
}
export interface VarianceContextSnapshot {
  type: 'variance';
  baseValue: number;
  deviationPercent: number;
  direction: string;
  observedValue: number;
  actualDeviation: number;
}
export type TriggerContextSnapshot =
  | ThresholdContextSnapshot
  | VarianceContextSnapshot;

/** Condición de disparo: union discriminada por `type`, con `evaluate()` adentro. */
export type TriggerCondition = ThresholdTrigger | VarianceTrigger;

/** Dispara cuando `observedValue <operator> value`. */
export class ThresholdTrigger {
  readonly type = 'threshold' as const;

  private constructor(
    private readonly _metricName: string,
    private readonly _operator: ComparisonOperator,
    private readonly _value: number,
  ) {}

  static create(
    raw: Omit<ThresholdConditionInput, 'type'>,
  ): Result<ThresholdTrigger, LayeredError> {
    const metricName = (raw.metricName ?? '').trim();
    if (metricName.length === 0) {
      return Result.fail<ThresholdTrigger>(
        TriggerConditionError.emptyMetricName(),
      );
    }
    if (metricName.length > MAX_METRIC_NAME_LENGTH) {
      return Result.fail<ThresholdTrigger>(
        TriggerConditionError.metricNameTooLong(MAX_METRIC_NAME_LENGTH),
      );
    }
    if (!Number.isFinite(raw.value)) {
      return Result.fail<ThresholdTrigger>(TriggerConditionError.valueNotFinite());
    }
    const operatorResult = ComparisonOperator.create(raw.operator);
    if (operatorResult.isFailure()) {
      return Result.fail<ThresholdTrigger>(operatorResult.error);
    }
    return Result.ok(
      new ThresholdTrigger(metricName, operatorResult.value, raw.value),
    );
  }

  evaluate(observedValue: number): boolean {
    switch (this._operator.operator) {
      case '>':
        return observedValue > this._value;
      case '<':
        return observedValue < this._value;
      case '>=':
        return observedValue >= this._value;
      case '<=':
        return observedValue <= this._value;
      case '==':
        return observedValue === this._value;
      case '!=':
        return observedValue !== this._value;
      default:
        return assertNever(this._operator.operator);
    }
  }

  /** Fotografía el disparo (NO decide si dispara: eso ya lo hizo `evaluate`). */
  capture(observedValue: number): ThresholdContextSnapshot {
    return {
      type: 'threshold',
      metricName: this._metricName,
      operator: this._operator.operator,
      threshold: this._value,
      observedValue,
    };
  }

  get metricName(): string {
    return this._metricName;
  }
  get operator(): string {
    return this._operator.operator;
  }
  get value(): number {
    return this._value;
  }
}

/** Dispara cuando la desviación de `observedValue` respecto de `baseValue` supera el umbral. */
export class VarianceTrigger {
  readonly type = 'variance' as const;

  private constructor(
    private readonly _baseValue: number,
    private readonly _deviationPercent: number,
    private readonly _direction: TriggerDirection,
  ) {}

  static create(
    raw: Omit<VarianceConditionInput, 'type'>,
  ): Result<VarianceTrigger, LayeredError> {
    if (!Number.isFinite(raw.baseValue)) {
      return Result.fail<VarianceTrigger>(
        TriggerConditionError.baseValueNotFinite(),
      );
    }
    if (raw.baseValue === 0) {
      return Result.fail<VarianceTrigger>(TriggerConditionError.baseValueZero());
    }
    if (!Number.isFinite(raw.deviationPercent) || raw.deviationPercent <= 0) {
      return Result.fail<VarianceTrigger>(
        TriggerConditionError.deviationNotPositive(),
      );
    }
    if (raw.deviationPercent > MAX_DEVIATION_PERCENT) {
      return Result.fail<VarianceTrigger>(
        TriggerConditionError.deviationTooLarge(MAX_DEVIATION_PERCENT),
      );
    }
    if (!VarianceTrigger.isDirection(raw.direction)) {
      return Result.fail<VarianceTrigger>(
        TriggerConditionError.invalidDirection(raw.direction, TRIGGER_DIRECTIONS),
      );
    }
    return Result.ok(
      new VarianceTrigger(raw.baseValue, raw.deviationPercent, raw.direction),
    );
  }

  /** Desviación porcentual (con signo) del valor observado respecto de la base. */
  actualDeviation(observedValue: number): number {
    return ((observedValue - this._baseValue) / Math.abs(this._baseValue)) * 100;
  }

  evaluate(observedValue: number): boolean {
    const deviation = this.actualDeviation(observedValue);
    switch (this._direction) {
      case 'above':
        return deviation >= this._deviationPercent;
      case 'below':
        return deviation <= -this._deviationPercent;
      case 'any':
        return Math.abs(deviation) >= this._deviationPercent;
      default:
        return assertNever(this._direction);
    }
  }

  /** Fotografía el disparo, calculando la desviación real observada (lógica de dominio). */
  capture(observedValue: number): VarianceContextSnapshot {
    return {
      type: 'variance',
      baseValue: this._baseValue,
      deviationPercent: this._deviationPercent,
      direction: this._direction,
      observedValue,
      actualDeviation: this.actualDeviation(observedValue),
    };
  }

  private static isDirection(value: string): value is TriggerDirection {
    return (TRIGGER_DIRECTIONS as readonly string[]).includes(value);
  }

  get baseValue(): number {
    return this._baseValue;
  }
  get deviationPercent(): number {
    return this._deviationPercent;
  }
  get direction(): TriggerDirection {
    return this._direction;
  }
}

/** Factory que discrimina por `type` y delega en la variante correcta. */
export const TriggerCondition = {
  create(raw: TriggerConditionInput): Result<TriggerCondition, LayeredError> {
    switch (raw.type) {
      case 'threshold':
        return ThresholdTrigger.create(raw);
      case 'variance':
        return VarianceTrigger.create(raw);
      default:
        return Result.fail<TriggerCondition>(
          TriggerConditionError.unknownType((raw as { type: string }).type),
        );
    }
  },
};
