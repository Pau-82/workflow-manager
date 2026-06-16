import type { NotificationDto } from '../../mappers/interface/notification.dto.js';

/** Output de ListNotifications: lista simple de notificaciones en primitivos. */
export interface ListNotificationsOutput {
  items: NotificationDto[];
}
