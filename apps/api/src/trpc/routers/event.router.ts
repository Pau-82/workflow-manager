import { listEventHistorySchema } from '@org/contracts';
import { ListEventHistoryHandler } from '@org/alerts';
import { publicProcedure, router } from '../trpc';
import { toTRPCError } from '../error-formatter';

export interface EventRouterDeps {
  listEventHistory: ListEventHistoryHandler;
}

/** Router de eventos de alerta. Procedures DELGADOS: validan, invocan el handler, traducen errores. */
export function createEventRouter(deps: EventRouterDeps) {
  return router({
    history: publicProcedure
      .input(listEventHistorySchema)
      .query(async ({ input }) => {
        const result = await deps.listEventHistory.execute(input);
        if (result.isFailure()) {
          throw toTRPCError(result.error);
        }
        return result.value;
      }),
  });
}
