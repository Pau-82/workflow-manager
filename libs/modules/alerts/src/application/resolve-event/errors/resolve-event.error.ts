import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/resolve-event.constants.js';

export const RESOLVE_EVENT_ERRORS = {
  NOT_FOUND: 'RESOLVE_EVENT_NOT_FOUND',
  ALREADY_RESOLVED: 'RESOLVE_EVENT_ALREADY_RESOLVED',
  INVALID_INPUT: 'RESOLVE_EVENT_INVALID_INPUT',
  PERSISTENCE_FAILED: 'RESOLVE_EVENT_PERSISTENCE_FAILED',
} as const;

/** Errores del caso de uso ResolveEvent (layer 'application'). */
export class ResolveEventError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Envuelve el NotFound del repositorio. `type` con NOT_FOUND → 404. */
  static notFound(
    reason: string,
    metadata?: Record<string, unknown>,
  ): ResolveEventError {
    return new ResolveEventError({
      context: CONTEXT,
      type: RESOLVE_EVENT_ERRORS.NOT_FOUND,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** El evento ya estaba resuelto. `type` con ALREADY → 409 CONFLICT. */
  static alreadyResolved(
    reason: string,
    metadata?: Record<string, unknown>,
  ): ResolveEventError {
    return new ResolveEventError({
      context: CONTEXT,
      type: RESOLVE_EVENT_ERRORS.ALREADY_RESOLVED,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** La nota (u otro dato de la transición) es inválida. `type` con INVALID_INPUT → 400. */
  static invalidInput(
    reason: string,
    metadata?: Record<string, unknown>,
  ): ResolveEventError {
    return new ResolveEventError({
      context: CONTEXT,
      type: RESOLVE_EVENT_ERRORS.INVALID_INPUT,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** Falla al persistir la resolución. */
  static persistenceFailed(reason: string): ResolveEventError {
    return new ResolveEventError({
      context: CONTEXT,
      type: RESOLVE_EVENT_ERRORS.PERSISTENCE_FAILED,
      reason,
      layer: LAYER,
    });
  }
}
