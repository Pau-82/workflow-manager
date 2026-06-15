import { LayeredError } from '../errors/result/layered-error.js';

/**
 * Puerto `Logger`: abstracción de logging (interfaz pura, sin framework).
 *
 * La capa de aplicación depende de ESTA interfaz (inyectada), nunca del logger
 * concreto de infraestructura → respeta las dependencias hacia adentro.
 * La implementación (Nest `StructuredLoggerService`) vive en `shared/infrastructure`.
 *
 * El dominio NO loguea (devuelve `Result`); este puerto lo consume la aplicación,
 * que puede loguear cualquier información: informativa (log/debug) o de error.
 */
export interface Logger {
  /** Información de flujo normal ("llegamos acá, esto salió bien"). */
  log(message: string, context?: string, data?: Record<string, unknown>): void;
  warn(message: string, context?: string, data?: Record<string, unknown>): void;
  debug(message: string, context?: string, data?: Record<string, unknown>): void;
  error(message: string, context?: string, data?: Record<string, unknown>): void;

  /** Loguea un `LayeredError` extrayendo type/layer/context/metadata. */
  logLayeredError(error: LayeredError, callerContext?: string): void;
  /** Normaliza y loguea cualquier error desconocido (Error nativo, string, etc.). */
  logUnknownError(error: unknown, callerContext?: string): void;
}
