import { Result, StringValueObject, type LayeredError } from '@org/shared';
import { NotificationTargetError } from '../errors/notification-target.error.js';

const MAX_LENGTH = 200;

/**
 * Destino in-app de la notificación. Identificador LIBRE (no hay usuarios en el
 * sistema): string no vacío (trim), máx 200. Sin formato impuesto.
 */
export class NotificationTarget extends StringValueObject {
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<NotificationTarget, LayeredError> {
    const sanitized = (raw ?? '').trim();
    if (sanitized.length === 0) {
      return Result.fail<NotificationTarget>(NotificationTargetError.empty());
    }
    if (sanitized.length > MAX_LENGTH) {
      return Result.fail<NotificationTarget>(
        NotificationTargetError.tooLong(MAX_LENGTH),
      );
    }
    return Result.ok(new NotificationTarget(sanitized));
  }

  get target(): string {
    return this.value;
  }
}
