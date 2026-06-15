import { StringValueObject } from '../string.vo.js';

class TestString extends StringValueObject {
  public constructor(value: string) {
    super(value);
  }
}

describe('StringValueObject', () => {
  it('reconoce como vacío un texto en blanco o con solo espacios', () => {
    expect(new TestString('').isEmpty()).toBe(true);
    expect(new TestString('   ').isEmpty()).toBe(true);
    expect(new TestString('x').isEmpty()).toBe(false);
  });

  it('informa la longitud real del texto, sin recortar espacios', () => {
    expect(new TestString('hola').length()).toBe(4);
    expect(new TestString(' a ').length()).toBe(3);
  });

  it('detecta si el texto contiene una porción buscada', () => {
    const vo = new TestString('workflow-manager');
    expect(vo.includes('flow')).toBe(true);
    expect(vo.includes('xyz')).toBe(false);
  });

  it('permite leer el texto que envuelve', () => {
    expect(new TestString('abc').value).toBe('abc');
  });
});
