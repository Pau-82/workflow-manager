import { Module } from '@nestjs/common';
import { PrismaModule } from '@org/shared/infrastructure';
import { WORKFLOW_REPOSITORY } from '../domain/ports/workflow.repository.port.js';
import { PrismaWorkflowRepository } from './prisma-workflow.repository.js';

/**
 * Expone el puerto IWorkflowRepository (token) para que OTROS módulos lo consuman
 * (alerts / SimulateTrigger en el V10). Sólo exporta el token; el adaptador concreto
 * queda encapsulado. Mismo criterio que NotificationCreatorModule.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    PrismaWorkflowRepository,
    { provide: WORKFLOW_REPOSITORY, useExisting: PrismaWorkflowRepository },
  ],
  exports: [WORKFLOW_REPOSITORY],
})
export class WorkflowRepositoryModule {}
