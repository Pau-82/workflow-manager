import { Module } from '@nestjs/common';
import { PrismaModule, StructuredLoggerModule } from '@org/shared/infrastructure';
import { WORKFLOW_REPOSITORY } from '../../domain/ports/workflow.repository.port.js';
import { PrismaWorkflowRepository } from '../../infrastructure/prisma-workflow.repository.js';
import { GetWorkflowHandler } from './get-workflow.handler.js';


@Module({
  imports: [PrismaModule, StructuredLoggerModule],
  providers: [
    GetWorkflowHandler,
    { provide: WORKFLOW_REPOSITORY, useClass: PrismaWorkflowRepository },
  ],
  exports: [GetWorkflowHandler],
})
export class GetWorkflowModule {}
