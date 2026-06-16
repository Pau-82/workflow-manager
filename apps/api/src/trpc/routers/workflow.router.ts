import { createWorkflowSchema } from '@org/contracts';
import { CreateWorkflowHandler } from '@org/workflows';
import { publicProcedure, router } from '../trpc';
import { toTRPCError } from '../error-formatter';

export interface WorkflowRouterDeps {
  createWorkflow: CreateWorkflowHandler;
}

/** Router de workflows. Procedures DELGADOS: validan input, invocan el handler, traducen errores. */
export function createWorkflowRouter(deps: WorkflowRouterDeps) {
  return router({
    create: publicProcedure
      .input(createWorkflowSchema)
      .mutation(async ({ input }) => {
        const result = await deps.createWorkflow.execute(input);
        if (result.isFailure()) {
          throw toTRPCError(result.error);
        }
        return result.value;
      }),
  });
}
