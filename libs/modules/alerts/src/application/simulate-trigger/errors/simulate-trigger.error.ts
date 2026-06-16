import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/simulate-trigger.constants.js';

export const SIMULATE_TRIGGER_ERRORS = {
  NOT_FOUND: 'SIMULATE_TRIGGER_NOT_FOUND',
  INVALID_EVENT: 'SIMULATE_TRIGGER_INVALID_EVENT',
  PERSISTENCE_FAILED: 'SIMULATE_TRIGGER_PERSISTENCE_FAILED',
  /** Señal INTERNA: hubo carrera y el evento abierto ya existía (no es error 5xx). */
  DUPLICATE_OPEN_EVENT: 'SIMULATE_TRIGGER_DUPLICATE_OPEN_EVENT',
} as const;

/** Errores del caso de uso SimulateTrigger (layer 'application'). */
export class SimulateTriggerError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Envuelve el NotFound del workflow. `type` con NOT_FOUND → 404. */
  static notFound(
    reason: string,
    metadata?: Record<string, unknown>,
  ): SimulateTriggerError {
    return new SimulateTriggerError({
      context: CONTEXT,
      type: SIMULATE_TRIGGER_ERRORS.NOT_FOUND,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** El agregado AlertEvent no se pudo construir (datos del disparo inválidos). */
  static invalidEvent(
    reason: string,
    metadata?: Record<string, unknown>,
  ): SimulateTriggerError {
    return new SimulateTriggerError({
      context: CONTEXT,
      type: SIMULATE_TRIGGER_ERRORS.INVALID_EVENT,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** Falla al persistir el evento o sus notificaciones. */
  static persistenceFailed(reason: string): SimulateTriggerError {
    return new SimulateTriggerError({
      context: CONTEXT,
      type: SIMULATE_TRIGGER_ERRORS.PERSISTENCE_FAILED,
      reason,
      layer: LAYER,
    });
  }

  /** Señal interna de duplicado por carrera (el handler la traduce a Result.ok). */
  static duplicateOpenEvent(reason: string): SimulateTriggerError {
    return new SimulateTriggerError({
      context: CONTEXT,
      type: SIMULATE_TRIGGER_ERRORS.DUPLICATE_OPEN_EVENT,
      reason,
      layer: LAYER,
    });
  }
}
