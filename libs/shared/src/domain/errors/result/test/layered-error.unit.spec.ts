import { LayeredError, type LayeredErrorProps } from '../layered-error.js';
import { UnexpectedError } from '../unexpected-error.js';

// Subclase concreta mínima (el constructor de LayeredError es protected).
class TestError extends LayeredError {
  public constructor(props: LayeredErrorProps) {
    super(props);
  }
}

describe('LayeredError', () => {
  it('si no se indica la capa, asume que el error es de dominio', () => {
    const e = new TestError({ context: 'ctx', type: 'T', reason: 'r' });
    expect(e.layer).toBe('domain');
  });

  it('usa la capa indicada cuando se especifica', () => {
    const e = new TestError({
      context: 'ctx',
      type: 'T',
      reason: 'r',
      layer: 'application',
    });
    expect(e.layer).toBe('application');
  });

  it('conserva y expone todos sus datos (contexto, tipo, motivo, metadata y fecha)', () => {
    const e = new TestError({
      context: 'ctx',
      type: 'T',
      reason: 'r',
      metadata: { a: 1 },
    });
    expect(e.context).toBe('ctx');
    expect(e.type).toBe('T');
    expect(e.reason).toBe('r');
    expect(e.metadata).toEqual({ a: 1 });
    expect(e.timestamp).toBeInstanceOf(Date);
  });

  it('sigue siendo reconocible como Error estándar y como LayeredError', () => {
    const e = new TestError({ context: 'c', type: 'T', reason: 'r' });
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(LayeredError);
  });

  it('se imprime en un formato legible que identifica capa, contexto, tipo y motivo', () => {
    const e = new TestError({
      context: 'ctx',
      type: 'MY_TYPE',
      reason: 'boom',
      layer: 'infrastructure',
    });
    expect(e.toString()).toBe('[infrastructure][ctx] MY_TYPE: boom');
  });
});

describe('UnexpectedError', () => {
  it('es un error del sistema con su tipo predefinido', () => {
    const e = new UnexpectedError('ctx', 'boom');
    expect(e).toBeInstanceOf(LayeredError);
    expect(e.type).toBe('UNEXPECTED_ERROR');
    expect(e.context).toBe('ctx');
    expect(e.reason).toBe('boom');
  });
});
