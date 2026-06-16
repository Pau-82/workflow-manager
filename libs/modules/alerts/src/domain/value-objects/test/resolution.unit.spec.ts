import { Resolution } from '../resolution/resolution.vo.js';
import { RESOLUTION_ERRORS } from '../../errors/resolution.error.js';

describe('Resolution', () => {
  it('open() nace abierto, sin fecha ni nota', () => {
    const open = Resolution.open();
    expect(open.status).toBe('abierto');
    expect(open.isOpen()).toBe(true);
    expect(open.resolvedAt).toBeNull();
    expect(open.note).toBeNull();
  });

  it('resolver un abierto lo pasa a resuelto, con fecha y nota normalizada', () => {
    const result = Resolution.open().resolve('  todo ok  ');
    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.status).toBe('resuelto');
      expect(result.value.isResolved()).toBe(true);
      expect(result.value.resolvedAt).toBeInstanceOf(Date);
      expect(result.value.note).toBe('todo ok');
    }
  });

  it('una nota en blanco se normaliza a null', () => {
    const result = Resolution.open().resolve('   ');
    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.note).toBeNull();
    }
  });

  it('resolver sin nota deja note en null', () => {
    const result = Resolution.open().resolve();
    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.note).toBeNull();
    }
  });

  it('rechaza una nota de más de 300 caracteres', () => {
    const result = Resolution.open().resolve('x'.repeat(301));
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(RESOLUTION_ERRORS.NOTE_TOO_LONG);
    }
  });

  it('resolver uno ya resuelto falla con alreadyResolved', () => {
    const resolved = Resolution.open().resolve('primera');
    if (resolved.isSuccess()) {
      const again = resolved.value.resolve('segunda');
      expect(again.isFailure()).toBe(true);
      if (again.isFailure()) {
        expect(again.error.type).toBe(RESOLUTION_ERRORS.ALREADY_RESOLVED);
      }
    }
  });

  describe('reconstitución desde primitivos', () => {
    it('reconstituye un abierto', () => {
      const result = Resolution.create({
        status: 'abierto',
        resolvedAt: null,
        note: null,
      });
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.status).toBe('abierto');
      }
    });

    it('reconstituye un resuelto con fecha y nota', () => {
      const result = Resolution.create({
        status: 'resuelto',
        resolvedAt: new Date('2026-06-03T18:00:00Z'),
        note: 'cerrado',
      });
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.status).toBe('resuelto');
        expect(result.value.note).toBe('cerrado');
      }
    });

    it('rechaza resuelto sin fecha', () => {
      const result = Resolution.create({
        status: 'resuelto',
        resolvedAt: null,
        note: null,
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(RESOLUTION_ERRORS.RESOLVED_WITHOUT_DATE);
      }
    });

    it('rechaza un status desconocido', () => {
      const result = Resolution.create({
        status: 'pausado',
        resolvedAt: null,
        note: null,
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(RESOLUTION_ERRORS.INVALID_STATUS);
      }
    });
  });
});
