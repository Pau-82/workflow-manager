import {
  activateWorkflowSchema,
  createWorkflowSchema,
  getWorkflowSchema,
  updateWorkflowSchema,
} from '@org/contracts';
import {
  ActivateWorkflowHandler,
  CreateWorkflowHandler,
  GetWorkflowHandler,
  ListWorkflowsHandler,
  UpdateWorkflowHandler,
} from '@org/workflows';
import { publicProcedure, router } from '../trpc';
import { toTRPCError } from '../error-formatter';

export interface WorkflowRouterDeps {
  createWorkflow: CreateWorkflowHandler;
  getWorkflow: GetWorkflowHandler;
  listWorkflows: ListWorkflowsHandler;
  updateWorkflow: UpdateWorkflowHandler;
  activateWorkflow: ActivateWorkflowHandler;
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

    update: publicProcedure
      .input(updateWorkflowSchema)
      .mutation(async ({ input }) => {
        const result = await deps.updateWorkflow.execute(input);
        if (result.isFailure()) {
          throw toTRPCError(result.error);
        }
        return result.value;
      }),

    activate: publicProcedure
      .input(activateWorkflowSchema)
      .mutation(async ({ input }) => {
        const result = await deps.activateWorkflow.execute(input);
        if (result.isFailure()) {
          throw toTRPCError(result.error);
        }
        return result.value;
      }),

    getById: publicProcedure
      .input(getWorkflowSchema)
      .query(async ({ input }) => {
        const result = await deps.getWorkflow.execute(input);
        if (result.isFailure()) {
          throw toTRPCError(result.error);
        }
        return result.value;
      }),

    list: publicProcedure.query(async () => {
      const result = await deps.listWorkflows.execute();
      if (result.isFailure()) {
        throw toTRPCError(result.error);
      }
      return result.value;
    }),
  });
}
