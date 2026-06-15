import { ValueObject } from '../vo.js';

// Subclases concretas mínimas para poder instanciar la base abstracta.
class StringVO extends ValueObject<string> {
  public constructor(value: string) {
    super(value);
  }
}
class OtherStringVO extends ValueObject<string> {
  public constructor(value: string) {
    super(value);
  }
}

describe('ValueObject (base)', () => {
  it('permite leer el valor que envuelve', () => {
    expect(new StringVO('hola').value).toBe('hola');
  });

  it('considera iguales a dos value objects del mismo tipo con el mismo valor', () => {
    expect(new StringVO('x').isEqualTo(new StringVO('x'))).toBe(true);
  });

  it('considera distintos a dos value objects con valores diferentes', () => {
    expect(new StringVO('x').isEqualTo(new StringVO('y'))).toBe(false);
  });

  it('nunca considera iguales a value objects de distinto tipo, aunque el valor coincida', () => {
    expect(new StringVO('x').isEqualTo(new OtherStringVO('x'))).toBe(false);
  });
});
