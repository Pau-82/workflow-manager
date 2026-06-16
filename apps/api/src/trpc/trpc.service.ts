import { Injectable } from '@nestjs/common';
import { CreateWorkflowHandler, GetWorkflowHandler } from '@org/workflows';
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
  ) {
    this.appRouter = createAppRouter({
      createWorkflow: this.createWorkflow,
      getWorkflow: this.getWorkflow,
    });
  }
}
