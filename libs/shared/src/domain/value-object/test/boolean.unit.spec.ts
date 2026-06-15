import { BooleanValueObject } from '../boolean.vo.js';

class TestBoolean extends BooleanValueObject {
  public constructor(value: boolean) {
    super(value);
  }
}

describe('BooleanValueObject', () => {
  it('refleja si el valor es verdadero o falso', () => {
    const yes = new TestBoolean(true);
    const no = new TestBoolean(false);
    expect(yes.isTrue()).toBe(true);
    expect(yes.isFalse()).toBe(false);
    expect(no.isTrue()).toBe(false);
    expect(no.isFalse()).toBe(true);
  });

  it('permite leer el booleano que envuelve', () => {
    expect(new TestBoolean(true).value).toBe(true);
  });
});
