import { ValueObject } from './vo.js';

/** Base para VOs que envuelven un `number`. */
export abstract class NumberValueObject extends ValueObject<number> {
  public isPositive(): boolean {
    return this.innerValue > 0;
  }

  public isZero(): boolean {
    return this.innerValue === 0;
  }

  public isFinite(): boolean {
    return Number.isFinite(this.innerValue);
  }
}
