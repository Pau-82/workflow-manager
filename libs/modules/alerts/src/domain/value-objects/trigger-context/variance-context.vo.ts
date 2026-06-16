import { Result, type LayeredError } from '@org/shared';
import { TriggerContextError } from '../../errors/trigger-context.error.js';

export const VARIANCE_DIRECTIONS = ['above', 'below', 'any'] as const;
export type VarianceDirection = (typeof VARIANCE_DIRECTIONS)[number];

export interface VarianceContextInput {
  type: 'variance';
  baseValue: number;
  deviationPercent: number;
  direction: string;
  observedValue: number;
  actualDeviation: number;
}

/** Disparo por variación: el valor observado se desvió de la base más de lo tolerado. */
export class VarianceContext {
  readonly type = 'variance' as const;

  private constructor(
    private readonly _baseValue: number,
    private readonly _deviationPercent: number,
    private readonly _direction: VarianceDirection,
    private readonly _observedValue: number,
    private readonly _actualDeviation: number,
  ) {}

  static create(
    raw: Omit<VarianceContextInput, 'type'>,
  ): Result<VarianceContext, LayeredError> {
    if (!Number.isFinite(raw.baseValue)) {
      return Result.fail<VarianceContext>(
        TriggerContextError.baseValueNotFinite(),
      );
    }
    if (!Number.isFinite(raw.deviationPercent)) {
      return Result.fail<VarianceContext>(
        TriggerContextError.deviationNotFinite(),
      );
    }
    if (!Number.isFinite(raw.observedValue)) {
      return Result.fail<VarianceContext>(
        TriggerContextError.observedValueNotFinite(),
      );
    }
    if (!Number.isFinite(raw.actualDeviation)) {
      return Result.fail<VarianceContext>(
        TriggerContextError.actualDeviationNotFinite(),
      );
    }
    if (!VarianceContext.isDirection(raw.direction)) {
      return Result.fail<VarianceContext>(
        TriggerContextError.invalidDirection(raw.direction, VARIANCE_DIRECTIONS),
      );
    }
    return Result.ok(
      new VarianceContext(
        raw.baseValue,
        raw.deviationPercent,
        raw.direction,
        raw.observedValue,
        raw.actualDeviation,
      ),
    );
  }

  private static isDirection(value: string): value is VarianceDirection {
    return (VARIANCE_DIRECTIONS as readonly string[]).includes(value);
  }

  get baseValue(): number {
    return this._baseValue;
  }
  get deviationPercent(): number {
    return this._deviationPercent;
  }
  get direction(): VarianceDirection {
    return this._direction;
  }
  get observedValue(): number {
    return this._observedValue;
  }
  get actualDeviation(): number {
    return this._actualDeviation;
  }
}
