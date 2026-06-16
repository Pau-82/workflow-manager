import type { LayeredError, Result } from '@org/shared';

/** Token de inyección para el puerto (DI por interfaz en NestJS). */
export const EMAIL_SENDER = Symbol('EmailSender');

/**
 * Capacidad de enviar un email (notificación por correo de un disparo). Se invoca
 * POST-COMMIT: un fallo de envío NO debe revertir el evento ya persistido. Devuelve
 * Result (no tira); el handler decide qué hacer (loguear y seguir).
 */
export interface IEmailSender {
  send(recipient: string, message: string): Promise<Result<void, LayeredError>>;
}
