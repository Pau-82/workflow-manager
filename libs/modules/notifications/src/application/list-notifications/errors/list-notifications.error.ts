import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/list-notifications.constants.js';

export const LIST_NOTIFICATIONS_ERRORS = {
  PERSISTENCE_FAILED: 'LIST_NOTIFICATIONS_PERSISTENCE_FAILED',
} as const;

/** Errores del caso de uso ListNotifications (layer 'application'). */
export class ListNotificationsError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Falla al leer las notificaciones del repositorio. */
  static persistenceFailed(reason: string): ListNotificationsError {
    return new ListNotificationsError({
      context: CONTEXT,
      type: LIST_NOTIFICATIONS_ERRORS.PERSISTENCE_FAILED,
      reason,
      layer: LAYER,
    });
  }
}
