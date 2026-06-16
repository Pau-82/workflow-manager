import { Module } from '@nestjs/common';
import {
  PrismaModule,
  StructuredLoggerModule,
  UnitOfWorkModule,
} from '@org/shared/infrastructure';
import { WorkflowRepositoryModule } from '@org/workflows';
import { NotificationCreatorModule } from '@org/notifications';
import { ALERT_EVENT_REPOSITORY } from '../../domain/ports/alert-event.repository.port.js';
import { EMAIL_SENDER } from '../../domain/ports/email-sender.port.js';
import { PrismaAlertEventRepository } from '../../infrastructure/prisma-alert-event.repository.js';
import { LoggerEmailSender } from '../../infrastructure/logger-email-sender.js';
import { SimulateTriggerHandler } from './simulate-trigger.handler.js';

/**
 * Caso de uso SimulateTrigger: orquesta workflow + alerts + notifications dentro de
 * un UnitOfWork. Importa las CAPACIDADES de otros módulos por sus módulos puente
 * (WorkflowRepositoryModule, NotificationCreatorModule, UnitOfWorkModule) y bindea
 * sus propios puertos (AlertEventRepository, EmailSender).
 */
@Module({
  imports: [
    PrismaModule,
    StructuredLoggerModule,
    UnitOfWorkModule,
    WorkflowRepositoryModule,
    NotificationCreatorModule,
  ],
  providers: [
    SimulateTriggerHandler,
    { provide: ALERT_EVENT_REPOSITORY, useClass: PrismaAlertEventRepository },
    { provide: EMAIL_SENDER, useClass: LoggerEmailSender },
  ],
  exports: [SimulateTriggerHandler],
})
export class SimulateTriggerModule {}
