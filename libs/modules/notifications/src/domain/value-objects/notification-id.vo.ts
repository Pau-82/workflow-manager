import { Result, Uuid, type LayeredError } from '@org/shared';
import { NotificationIdError } from '../errors/notification-id.error.js';

/** Identidad del agregado Notification (UUID). Branded: no intercambiable con otros ids. */
export class NotificationId extends Uuid {
  readonly kind = 'NotificationId' as const;

  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<NotificationId, LayeredError> {
    const sanitized = (raw ?? '').trim();
    if (!Uuid.isValid(sanitized)) {
      return Result.fail<NotificationId>(NotificationIdError.invalid(raw));
    }
    return Result.ok(new NotificationId(sanitized));
  }

  static generate(): NotificationId {
    return new NotificationId(globalThis.crypto.randomUUID());
  }
}
