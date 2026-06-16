import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'ComparisonOperator';

export const COMPARISON_OPERATOR_ERRORS = {
  INVALID: 'COMPARISON_OPERATOR_INVALID',
} as const;

export class ComparisonOperatorError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static invalid(value: string, allowed: readonly string[]): ComparisonOperatorError {
    return new ComparisonOperatorError({
      context: CONTEXT,
      type: COMPARISON_OPERATOR_ERRORS.INVALID,
      reason: `Invalid comparison operator: "${value}".`,
      layer: 'domain',
      metadata: { value, allowed },
    });
  }
}
