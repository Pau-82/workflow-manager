import { Module } from '@nestjs/common';
import { PrismaModule, StructuredLoggerModule } from '@org/shared/infrastructure';
import { WORKFLOW_REPOSITORY } from '../../domain/ports/workflow.repository.port.js';
import { PrismaWorkflowRepository } from '../../infrastructure/prisma-workflow.repository.js';
import { ListWorkflowsHandler } from './list-workflows.handler.js';

/** Caso de uso ListWorkflows: provee el handler y bindea el puerto al adaptador Prisma. */
@Module({
  imports: [PrismaModule, StructuredLoggerModule],
  providers: [
    ListWorkflowsHandler,
    { provide: WORKFLOW_REPOSITORY, useClass: PrismaWorkflowRepository },
  ],
  exports: [ListWorkflowsHandler],
})
export class ListWorkflowsModule {}
