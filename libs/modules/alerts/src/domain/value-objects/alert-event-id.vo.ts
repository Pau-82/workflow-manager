import { Result, Uuid, type LayeredError } from '@org/shared';
import { AlertEventIdError } from '../errors/alert-event-id.error.js';

/** Identidad del agregado AlertEvent (UUID). Branded: no intercambiable con otros ids. */
export class AlertEventId extends Uuid {
  // Marca nominal: distingue AlertEventId de otros ids en tiempo de compilación.
  readonly kind = 'AlertEventId' as const;

  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<AlertEventId, LayeredError> {
    const sanitized = (raw ?? '').trim();
    if (!Uuid.isValid(sanitized)) {
      return Result.fail<AlertEventId>(AlertEventIdError.invalid(raw));
    }
    return Result.ok(new AlertEventId(sanitized));
  }

  static generate(): AlertEventId {
    return new AlertEventId(globalThis.crypto.randomUUID());
  }
}
