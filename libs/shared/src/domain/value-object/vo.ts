/**
 * Clase base de todos los Value Objects.
 * Inmutable (innerValue readonly, sin setters). La igualdad es por valor y
 * exige que sea el MISMO VO concreto (dos VOs distintos con igual valor no son
 * iguales).
 */
export abstract class ValueObject<T> {
  protected readonly innerValue: T;

  protected constructor(value: T) {
    this.innerValue = value;
  }

  public isEqualTo(other: ValueObject<T>): boolean {
    return (
      this.constructor === other.constructor &&
      this.innerValue === other.innerValue
    );
  }

  public get value(): T {
    return this.innerValue;
  }
}
