import { router } from './trpc';
import {
  createWorkflowRouter,
  type WorkflowRouterDeps,
} from './routers/workflow.router';
import {
  createEventRouter,
  type EventRouterDeps,
} from './routers/event.router';

export type AppRouterDeps = WorkflowRouterDeps & EventRouterDeps;

/** appRouter raíz: combina los routers de cada módulo. */
export function createAppRouter(deps: AppRouterDeps) {
  return router({
    workflow: createWorkflowRouter(deps),
    event: createEventRouter(deps),
  });
}

/** Tipo del router para el cliente tRPC (type-safety end-to-end). */
export type AppRouter = ReturnType<typeof createAppRouter>;
