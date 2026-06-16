import type { Notification } from '../../domain/aggregate/notification.aggregate.js';
import type { NotificationDto } from './interface/notification.dto.js';

/** Mapea el agregado Notification a su DTO de primitivos. Compartido entre casos de uso. */
export class NotificationMapper {

  static toDto(notification: Notification): NotificationDto {
    return {
      id: notification.id,
      alertEventId: notification.alertEventId,
      target: notification.target,
      message: notification.message,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
