import { Result, StringValueObject, type LayeredError } from '@org/shared';
import { NotificationMessageError } from '../errors/notification-message.error.js';

const MAX_LENGTH = 500;

/**
 * Texto mostrado de la notificación (el mensaje ya renderizado que llega del
 * disparo). String no vacío (trim), máx 500.
 */
export class NotificationMessage extends StringValueObject {
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<NotificationMessage, LayeredError> {
    const sanitized = (raw ?? '').trim();
    if (sanitized.length === 0) {
      return Result.fail<NotificationMessage>(NotificationMessageError.empty());
    }
    if (sanitized.length > MAX_LENGTH) {
      return Result.fail<NotificationMessage>(
        NotificationMessageError.tooLong(MAX_LENGTH),
      );
    }
    return Result.ok(new NotificationMessage(sanitized));
  }

  get message(): string {
    return this.value;
  }
}
