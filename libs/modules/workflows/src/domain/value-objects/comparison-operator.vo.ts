import { Result, StringValueObject, type LayeredError } from '@org/shared';
import { ComparisonOperatorError } from '../errors/comparison-operator.error.js';

export const COMPARISON_OPERATORS = ['>', '<', '>=', '<=', '==', '!='] as const;
export type ComparisonOperatorValue = (typeof COMPARISON_OPERATORS)[number];

/** Operador de comparación: enum cerrado. */
export class ComparisonOperator extends StringValueObject {
  //#region construction
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<ComparisonOperator, LayeredError> {
    const sanitized = ComparisonOperator.sanitize(raw);
    if (!ComparisonOperator.isValid(sanitized)) {
      return Result.fail<ComparisonOperator>(
        ComparisonOperatorError.invalid(sanitized, COMPARISON_OPERATORS),
      );
    }
    return Result.ok(new ComparisonOperator(sanitized));
  }

  private static sanitize(raw: string): string {
    return (raw ?? '').trim();
  }

  private static isValid(value: string): value is ComparisonOperatorValue {
    return (COMPARISON_OPERATORS as readonly string[]).includes(value);
  }
  //#endregion

  //#region accessors
  get operator(): ComparisonOperatorValue {
    return this.value as ComparisonOperatorValue;
  }
  //#endregion
}
