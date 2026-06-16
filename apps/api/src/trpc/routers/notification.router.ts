import { ListNotificationsHandler } from '@org/notifications';
import { publicProcedure, router } from '../trpc';
import { toTRPCError } from '../error-formatter';

export interface NotificationRouterDeps {
  listNotifications: ListNotificationsHandler;
}

/** Router de notificaciones. Procedures DELGADOS: invocan el handler, traducen errores. */
export function createNotificationRouter(deps: NotificationRouterDeps) {
  return router({
    list: publicProcedure.query(async () => {
      const result = await deps.listNotifications.execute();
      if (result.isFailure()) {
        throw toTRPCError(result.error);
      }
      return result.value;
    }),
  });
}
