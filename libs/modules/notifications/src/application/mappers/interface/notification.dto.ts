/**
 * DTO plano de la notificación (primitivos). Fechas como ISO string (JSON-friendly).
 * Lo comparten los casos de uso que devuelven una notificación.
 */
export interface NotificationDto {
  id: string;
  alertEventId: string;
  target: string;
  message: string;
  createdAt: string;
}
