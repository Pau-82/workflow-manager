import { Result } from '../result.js';
import { UnexpectedError } from '../unexpected-error.js';

const anError = () => new UnexpectedError('test', 'boom');

describe('Result', () => {
  describe('resultado exitoso y resultado fallido', () => {
    it('un resultado exitoso se marca como tal y deja leer el valor', () => {
      const r = Result.ok(42);
      expect(r.isSuccess()).toBe(true);
      expect(r.isFailure()).toBe(false);
      expect(r.value).toBe(42);
    });

    it('un resultado fallido se marca como tal y deja leer el error', () => {
      const e = anError();
      const r = Result.fail<number>(e);
      expect(r.isFailure()).toBe(true);
      expect(r.error).toBe(e);
    });

    it('avisa con una excepción si se lee el valor de un fallo o el error de un éxito', () => {
      expect(() => Result.ok(1).error).toThrow();
      expect(() => Result.fail(anError()).value).toThrow();
    });
  });

  describe('combinar varios resultados', () => {
    it('si todos son exitosos, junta todos los valores', () => {
      const c = Result.combine([Result.ok(1), Result.ok(2)]);
      expect(c.success).toBe(true);
      expect(c.values).toEqual([1, 2]);
      expect(c.errors).toHaveLength(0);
    });

    it('si hay fallos, los reúne todos sin frenar en el primero', () => {
      const c = Result.combine([
        Result.ok(1),
        Result.fail(anError()),
        Result.fail(anError()),
      ]);
      expect(c.success).toBe(false);
      expect(c.errors).toHaveLength(2);
    });
  });

  describe('ejecutar código que puede fallar', () => {
    it('devuelve un resultado exitoso con lo que retornó la función', () => {
      const r = Result.execute(() => 5);
      expect(r.isSuccess()).toBe(true);
      expect(r.value).toBe(5);
    });

    it('convierte una excepción inesperada en un error controlado', () => {
      const r = Result.execute(() => {
        throw new Error('x');
      });
      expect(r.isFailure()).toBe(true);
      expect(r.error).toBeInstanceOf(UnexpectedError);
    });

    it('si lo que se lanza ya es un error del sistema, lo deja pasar sin envolver', () => {
      const e = anError();
      const r = Result.execute(() => {
        throw e;
      });
      expect(r.error).toBe(e);
    });

    it('también atrapa excepciones en funciones asíncronas', async () => {
      const r = await Result.executeAsync(async () => {
        throw new Error('x');
      });
      expect(r.isFailure()).toBe(true);
      expect(r.error).toBeInstanceOf(UnexpectedError);
    });
  });
});
