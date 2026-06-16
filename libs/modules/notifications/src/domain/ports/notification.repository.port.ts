import type { Notification } from '../aggregate/notification.aggregate.js';

/** Token de inyección para el puerto (DI por interfaz en NestJS). */
export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');

/**
 * Puerto de persistencia del agregado Notification. La capa de aplicación depende de
 * esta interfaz, nunca de Prisma.
 */
export interface INotificationRepository {
  /** Inserta una notificación nueva. */
  save(notification: Notification): Promise<void>;

  /** Lista simple: todas las notificaciones (orden DESC por createdAt). */
  list(): Promise<Notification[]>;
}
