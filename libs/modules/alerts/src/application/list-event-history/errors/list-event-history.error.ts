import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/list-event-history.constants.js';

export const LIST_EVENT_HISTORY_ERRORS = {
  PERSISTENCE_FAILED: 'LIST_EVENT_HISTORY_PERSISTENCE_FAILED',
} as const;

/** Errores del caso de uso ListEventHistory (layer 'application'). */
export class ListEventHistoryError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Falla al leer el historial del repositorio. */
  static persistenceFailed(reason: string): ListEventHistoryError {
    return new ListEventHistoryError({
      context: CONTEXT,
      type: LIST_EVENT_HISTORY_ERRORS.PERSISTENCE_FAILED,
      reason,
      layer: LAYER,
    });
  }
}
