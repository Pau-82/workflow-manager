import { Module } from '@nestjs/common';
import { PrismaModule, StructuredLoggerModule } from '@org/shared/infrastructure';
import { WORKFLOW_REPOSITORY } from '../../domain/ports/workflow.repository.port.js';
import { PrismaWorkflowRepository } from '../../infrastructure/prisma-workflow.repository.js';
import { UpdateWorkflowHandler } from './update-workflow.handler.js';

/** Caso de uso UpdateWorkflow: provee el handler y bindea el puerto al adaptador Prisma. */
@Module({
  imports: [PrismaModule, StructuredLoggerModule],
  providers: [
    UpdateWorkflowHandler,
    { provide: WORKFLOW_REPOSITORY, useClass: PrismaWorkflowRepository },
  ],
  exports: [UpdateWorkflowHandler],
})
export class UpdateWorkflowModule {}
