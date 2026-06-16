import type { LayeredError, Result } from '@org/shared';

/** Token de inyección para el puerto (DI por interfaz en NestJS). */
export const NOTIFICATION_CREATOR = Symbol('NotificationCreator');

/** Datos crudos para crear una notificación in-app. */
export interface CreateNotificationInput {
  alertEventId: string;
  target: string;
  message: string;
}

/**
 * Capacidad de crear notificaciones, pensada para que OTROS módulos (alerts /
 * SimulateTrigger en el V10) la consuman dentro de su propia transacción. Por eso
 * acepta un cliente/contexto transaccional OPCIONAL y opaco (`tx`): el adaptador
 * concreto lo interpreta (p. ej. un cliente Prisma transaccional); el dominio no
 * conoce la tecnología. Sin `tx`, persiste con su conexión por defecto.
 */
export interface INotificationCreator {
  create(
    input: CreateNotificationInput,
    tx?: unknown,
  ): Promise<Result<void, LayeredError>>;
}
