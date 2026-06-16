import {
  ComparisonOperator,
  COMPARISON_OPERATORS,
} from '../comparison-operator.vo.js';
import { COMPARISON_OPERATOR_ERRORS } from '../../errors/comparison-operator.error.js';

describe('ComparisonOperator', () => {
  it('acepta cada uno de los operadores válidos', () => {
    for (const operator of COMPARISON_OPERATORS) {
      const result = ComparisonOperator.create(operator);
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.operator).toBe(operator);
      }
    }
  });

  it('rechaza un operador que no está en el conjunto permitido', () => {
    const result = ComparisonOperator.create('=>');
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(COMPARISON_OPERATOR_ERRORS.INVALID);
    }
  });
});
