import { Logger as NestLogger } from '@nestjs/common';
import { StructuredLoggerService } from '../structured-logger.service.js';
import {
  LayeredError,
  type LayeredErrorProps,
} from '../../../domain/errors/result/layered-error.js';
import type { StructuredLogEntry } from '../interface/structured-log-entry.js';
import type { StructuredErrorLogEntry } from '../interface/structured-error-log-entry.js';

// Error de dominio concreto para controlar la `layer` en los tests.
class TestLayeredError extends LayeredError {
  public constructor(props: LayeredErrorProps) {
    super(props);
  }
}

describe('StructuredLoggerService', () => {
  let service: StructuredLoggerService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Interceptamos el logger de Nest: capturamos lo que se loguea y evitamos
    // ensuciar la consola del test.
    logSpy = jest.spyOn(NestLogger.prototype, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(NestLogger.prototype, 'warn').mockImplementation(() => undefined);
    debugSpy = jest.spyOn(NestLogger.prototype, 'debug').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(NestLogger.prototype, 'error').mockImplementation(() => undefined);
    service = new StructuredLoggerService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registro de información de flujo normal', () => {
    it('registra un mensaje informativo con sus datos estructurados y el contexto', () => {
      service.log('Workflow creado', 'CreateWorkflow', { workflowId: 'wf-1' });

      expect(logSpy).toHaveBeenCalledTimes(1);
      const entry = logSpy.mock.calls[0][0] as StructuredLogEntry;
      expect(entry.message).toBe('Workflow creado');
      expect(entry.context).toBe('CreateWorkflow');
      expect(entry.data).toEqual({ workflowId: 'wf-1' });
      expect(entry.timestamp).toEqual(expect.any(String));
    });

    it('también permite registrar advertencias y mensajes de debug', () => {
      service.warn('algo a revisar', 'Ctx');
      service.debug('detalle interno', 'Ctx');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(debugSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('protección de datos sensibles', () => {
    it('oculta campos sensibles (contraseñas, tokens) antes de escribir el log', () => {
      service.log('intento de acceso', 'Auth', {
        password: 'secreto',
        token: 'abc123',
        user: 'pau',
      });

      const entry = logSpy.mock.calls[0][0] as StructuredLogEntry;
      expect(entry.data?.['password']).toBe('***REDACTED***');
      expect(entry.data?.['token']).toBe('***REDACTED***');
      expect(entry.data?.['user']).toBe('pau'); // lo no sensible se conserva
    });

    it('no se rompe si los datos tienen referencias circulares', () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;

      expect(() => service.log('con ciclo', 'Ctx', { circular })).not.toThrow();
      const entry = logSpy.mock.calls[0][0] as StructuredLogEntry;
      expect(entry.data).toHaveProperty('_logError');
    });
  });

  describe('registro de errores de dominio', () => {
    const domainError = () =>
      new TestLayeredError({
        context: 'WorkflowName',
        type: 'EMPTY_NAME',
        reason: 'the name cannot be empty',
        layer: 'domain',
      });

    it('registra el error con su tipo, capa, contexto y motivo', () => {
      service.logLayeredError(domainError(), 'CreateWorkflow');

      const entry = errorSpy.mock.calls[0][0] as StructuredErrorLogEntry;
      expect(entry.errorType).toBe('EMPTY_NAME');
      expect(entry.errorLayer).toBe('domain');
      expect(entry.errorContext).toBe('WorkflowName');
      expect(entry.reason).toBe('the name cannot be empty');
    });

    it('para un error de dominio NO adjunta stack trace (es un fallo esperado)', () => {
      service.logLayeredError(domainError(), 'CreateWorkflow');

      const entry = errorSpy.mock.calls[0][0] as StructuredErrorLogEntry;
      expect(entry.stack).toBeUndefined();
    });

    it('para un error de infraestructura SÍ adjunta stack trace (fallo inesperado)', () => {
      const infraError = new TestLayeredError({
        context: 'PrismaWorkflowRepository',
        type: 'DB_DOWN',
        reason: 'connection refused',
        layer: 'infrastructure',
      });

      service.logLayeredError(infraError, 'SimulateTrigger');

      const entry = errorSpy.mock.calls[0][0] as StructuredErrorLogEntry;
      expect(entry.stack).toEqual(expect.any(String));
    });
  });

  describe('registro de errores desconocidos', () => {
    it('si el error ya es un error del sistema, lo trata como tal', () => {
      const layered = new TestLayeredError({
        context: 'X',
        type: 'SOME_TYPE',
        reason: 'boom',
        layer: 'domain',
      });
      const delegateSpy = jest.spyOn(service, 'logLayeredError');

      service.logUnknownError(layered, 'Ctx');

      expect(delegateSpy).toHaveBeenCalledWith(layered, 'Ctx');
    });

    it('normaliza un Error nativo como error de infraestructura y conserva su stack', () => {
      service.logUnknownError(new Error('algo explotó'), 'Ctx');

      const entry = errorSpy.mock.calls[0][0] as StructuredErrorLogEntry;
      expect(entry.errorType).toBe('Error');
      expect(entry.errorLayer).toBe('infrastructure');
      expect(entry.reason).toBe('algo explotó');
      expect(errorSpy.mock.calls[0][1]).toEqual(expect.any(String)); // stack
    });

    it('acepta también un error expresado como texto', () => {
      service.logUnknownError('falla rara', 'Ctx');

      const entry = errorSpy.mock.calls[0][0] as StructuredLogEntry;
      expect(entry.message).toBe('falla rara');
    });
  });
});
