import { Module } from '@nestjs/common';
import { PrismaModule } from '@org/shared/infrastructure';
import { NOTIFICATION_CREATOR } from '../domain/ports/notification-creator.port.js';
import { PrismaNotificationRepository } from './prisma-notification.repository.js';
import { PrismaNotificationCreator } from './prisma-notification-creator.js';

/**
 * Expone la CAPACIDAD de crear notificaciones (INotificationCreator) para que otros
 * módulos la importen y consuman (alerts / SimulateTrigger en el V10). Sólo exporta
 * el token del puerto; el adaptador concreto queda encapsulado.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    PrismaNotificationRepository,
    { provide: NOTIFICATION_CREATOR, useClass: PrismaNotificationCreator },
  ],
  exports: [NOTIFICATION_CREATOR],
})
export class NotificationCreatorModule {}
