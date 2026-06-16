import { Injectable } from '@nestjs/common';
import {
  ActivateWorkflowHandler,
  CreateWorkflowHandler,
  DeactivateWorkflowHandler,
  GetWorkflowHandler,
  ListWorkflowsHandler,
  UpdateWorkflowHandler,
} from '@org/workflows';
import { ListEventHistoryHandler, ResolveEventHandler } from '@org/alerts';
import { createAppRouter, type AppRouter } from './app.router';

/**
 * Construye el appRouter resolviendo los handlers desde el contenedor de DI de
 * NestJS. main.ts toma este `appRouter` y lo monta como middleware express.
 */
@Injectable()
export class TrpcService {
  readonly appRouter: AppRouter;

  constructor(
    private readonly createWorkflow: CreateWorkflowHandler,
    private readonly getWorkflow: GetWorkflowHandler,
    private readonly listWorkflows: ListWorkflowsHandler,
    private readonly updateWorkflow: UpdateWorkflowHandler,
    private readonly activateWorkflow: ActivateWorkflowHandler,
    private readonly deactivateWorkflow: DeactivateWorkflowHandler,
    private readonly listEventHistory: ListEventHistoryHandler,
    private readonly resolveEvent: ResolveEventHandler,
  ) {
    this.appRouter = createAppRouter({
      createWorkflow: this.createWorkflow,
      getWorkflow: this.getWorkflow,
      listWorkflows: this.listWorkflows,
      updateWorkflow: this.updateWorkflow,
      activateWorkflow: this.activateWorkflow,
      deactivateWorkflow: this.deactivateWorkflow,
      listEventHistory: this.listEventHistory,
      resolveEvent: this.resolveEvent,
    });
  }
}
