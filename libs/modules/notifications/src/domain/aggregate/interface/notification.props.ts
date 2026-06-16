/** Input crudo para registrar una notificación nueva (sin id; createdAt opcional). */
export interface CreateNotificationProps {
  alertEventId: string;
  target: string;
  message: string;
  /** Momento de creación. Por defecto, ahora. */
  createdAt?: Date;
}

/** Snapshot crudo para reconstituir una notificación desde persistencia. */
export interface NotificationPersistenceProps {
  id: string;
  alertEventId: string;
  target: string;
  message: string;
  createdAt: Date;
}
