import { ValueObject } from './vo.js';

/** Base para VOs que envuelven un `boolean`. */
export abstract class BooleanValueObject extends ValueObject<boolean> {
  public isTrue(): boolean {
    return this.innerValue === true;
  }

  public isFalse(): boolean {
    return this.innerValue === false;
  }
}
