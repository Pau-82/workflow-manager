import { ValueObject } from './vo.js';

/**
 * Base para VOs que envuelven un `Date`.
 * Dos cuidados propios de Date:
 *  - validez: rechaza `Invalid Date` en construcción.
 *  - inmutabilidad: Date es mutable, así que se hacen copias defensivas tanto
 *    al entrar (constructor) como al salir (getter `value`).
 */
export abstract class DateValueObject extends ValueObject<Date> {
  protected constructor(value: Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Fecha inválida.');
    }
    super(new Date(value));
  }

  public override get value(): Date {
    return new Date(this.innerValue);
  }

  public isBefore(other: DateValueObject): boolean {
    return this.innerValue.getTime() < other.innerValue.getTime();
  }

  public isAfter(other: DateValueObject): boolean {
    return this.innerValue.getTime() > other.innerValue.getTime();
  }

  public override isEqualTo(other: DateValueObject): boolean {
    return (
      this.constructor === other.constructor &&
      this.innerValue.getTime() === other.innerValue.getTime()
    );
  }
}
