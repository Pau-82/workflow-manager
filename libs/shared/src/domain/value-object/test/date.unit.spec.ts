import { DateValueObject } from '../date.vo.js';

class TestDate extends DateValueObject {
  public constructor(value: Date) {
    super(value);
  }
}
class OtherDate extends DateValueObject {
  public constructor(value: Date) {
    super(value);
  }
}

const ISO = '2026-01-01T00:00:00.000Z';

describe('DateValueObject', () => {
  it('se construye a partir de una fecha válida', () => {
    const vo = new TestDate(new Date(ISO));
    expect(vo.value.getTime()).toBe(Date.parse(ISO));
  });

  it('rechaza una fecha inválida', () => {
    expect(() => new TestDate(new Date('no-es-fecha'))).toThrow('Fecha inválida.');
  });

  describe('no se puede modificar desde afuera (copias defensivas)', () => {
    it('modificar la fecha original no afecta al value object', () => {
      const input = new Date(ISO);
      const vo = new TestDate(input);
      input.setFullYear(1999);
      expect(vo.value.getTime()).toBe(Date.parse(ISO));
    });

    it('modificar la fecha devuelta no afecta al value object', () => {
      const vo = new TestDate(new Date(ISO));
      const out = vo.value;
      out.setFullYear(1999);
      expect(vo.value.getTime()).toBe(Date.parse(ISO));
    });
  });

  describe('comparación entre fechas', () => {
    const early = () => new TestDate(new Date('2026-01-01T00:00:00.000Z'));
    const late = () => new TestDate(new Date('2026-12-31T00:00:00.000Z'));

    it('sabe cuál fecha es anterior y cuál posterior', () => {
      expect(early().isBefore(late())).toBe(true);
      expect(late().isBefore(early())).toBe(false);
      expect(late().isAfter(early())).toBe(true);
    });

    it('dos fechas del mismo instante y tipo son iguales; de distinto tipo, no', () => {
      expect(early().isEqualTo(new TestDate(new Date(ISO)))).toBe(true);
      expect(early().isEqualTo(late())).toBe(false);
      expect(early().isEqualTo(new OtherDate(new Date(ISO)))).toBe(false);
    });
  });
});
