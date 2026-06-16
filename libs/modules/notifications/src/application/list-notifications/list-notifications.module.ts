import { Module } from '@nestjs/common';
import { PrismaModule, StructuredLoggerModule } from '@org/shared/infrastructure';
import { NOTIFICATION_REPOSITORY } from '../../domain/ports/notification.repository.port.js';
import { PrismaNotificationRepository } from '../../infrastructure/prisma-notification.repository.js';
import { ListNotificationsHandler } from './list-notifications.handler.js';

/** Caso de uso ListNotifications: provee el handler y bindea el puerto al adaptador Prisma. */
@Module({
  imports: [PrismaModule, StructuredLoggerModule],
  providers: [
    ListNotificationsHandler,
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
  ],
  exports: [ListNotificationsHandler],
})
export class ListNotificationsModule {}
