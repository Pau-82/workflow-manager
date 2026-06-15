import { ValueObject } from './vo.js';

/** Base para VOs que envuelven un `string`. */
export abstract class StringValueObject extends ValueObject<string> {
  public isEmpty(): boolean {
    return this.innerValue.trim().length === 0;
  }

  public length(): number {
    return this.innerValue.length;
  }

  public includes(search: string): boolean {
    return this.innerValue.includes(search);
  }
}
