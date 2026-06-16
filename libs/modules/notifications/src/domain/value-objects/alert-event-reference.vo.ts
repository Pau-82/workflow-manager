import { Result, Uuid, type LayeredError } from '@org/shared';
import { AlertEventReferenceError } from '../errors/alert-event-reference.error.js';

/**
 * Referencia (por ID) al AlertEvent que originó la notificación. NO embebe el
 * evento: sólo guarda su id. Branded para no confundirla con la identidad propia.
 * Valida formato UUID; la existencia real la garantiza la FK.
 */
export class AlertEventReference extends Uuid {
  readonly kind = 'AlertEventReference' as const;

  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<AlertEventReference, LayeredError> {
    const sanitized = (raw ?? '').trim();
    if (!Uuid.isValid(sanitized)) {
      return Result.fail<AlertEventReference>(
        AlertEventReferenceError.invalid(raw),
      );
    }
    return Result.ok(new AlertEventReference(sanitized));
  }
}
