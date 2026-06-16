import { Module } from '@nestjs/common';
import { PrismaModule, StructuredLoggerModule } from '@org/shared/infrastructure';
import { ALERT_EVENT_REPOSITORY } from '../../domain/ports/alert-event.repository.port.js';
import { PrismaAlertEventRepository } from '../../infrastructure/prisma-alert-event.repository.js';
import { ListEventHistoryHandler } from './list-event-history.handler.js';

/** Caso de uso ListEventHistory: provee el handler y bindea el puerto al adaptador Prisma. */
@Module({
  imports: [PrismaModule, StructuredLoggerModule],
  providers: [
    ListEventHistoryHandler,
    { provide: ALERT_EVENT_REPOSITORY, useClass: PrismaAlertEventRepository },
  ],
  exports: [ListEventHistoryHandler],
})
export class ListEventHistoryModule {}
