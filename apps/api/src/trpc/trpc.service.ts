import { Injectable } from '@nestjs/common';
import {
  ActivateWorkflowHandler,
  CreateWorkflowHandler,
  GetWorkflowHandler,
  ListWorkflowsHandler,
  UpdateWorkflowHandler,
} from '@org/workflows';
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
  ) {
    this.appRouter = createAppRouter({
      createWorkflow: this.createWorkflow,
      getWorkflow: this.getWorkflow,
      listWorkflows: this.listWorkflows,
      updateWorkflow: this.updateWorkflow,
      activateWorkflow: this.activateWorkflow,
    });
  }
}
