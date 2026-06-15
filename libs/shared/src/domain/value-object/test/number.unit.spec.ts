import { NumberValueObject } from '../number.vo.js';

class TestNumber extends NumberValueObject {
  public constructor(value: number) {
    super(value);
  }
}

describe('NumberValueObject', () => {
  it('reconoce los números positivos', () => {
    expect(new TestNumber(1).isPositive()).toBe(true);
    expect(new TestNumber(0).isPositive()).toBe(false);
    expect(new TestNumber(-1).isPositive()).toBe(false);
  });

  it('reconoce el cero', () => {
    expect(new TestNumber(0).isZero()).toBe(true);
    expect(new TestNumber(0.1).isZero()).toBe(false);
  });

  it('distingue un número finito de NaN o infinito', () => {
    expect(new TestNumber(42).isFinite()).toBe(true);
    expect(new TestNumber(NaN).isFinite()).toBe(false);
    expect(new TestNumber(Infinity).isFinite()).toBe(false);
  });

  it('permite leer el número que envuelve', () => {
    expect(new TestNumber(7).value).toBe(7);
  });
});
