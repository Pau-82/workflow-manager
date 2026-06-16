import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'Resolution';

export const RESOLUTION_ERRORS = {
  ALREADY_RESOLVED: 'RESOLUTION_ALREADY_RESOLVED',
  NOTE_TOO_LONG: 'RESOLUTION_NOTE_TOO_LONG',
  RESOLVED_WITHOUT_DATE: 'RESOLUTION_RESOLVED_WITHOUT_DATE',
  INVALID_RESOLVED_AT: 'RESOLUTION_INVALID_RESOLVED_AT',
  INVALID_STATUS: 'RESOLUTION_INVALID_STATUS',
} as const;

/**
 * Errores del VO Resolution (layer 'domain'). La invariante "resuelto ⇒ tiene fecha,
 * abierto ⇒ sin fecha/nota" es estructural (no necesita chequeo); estos errores cubren
 * las transiciones y la reconstitución desde primitivos.
 */
export class ResolutionError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Intento de resolver un evento que ya está resuelto. `type` con ALREADY → 409. */
  static alreadyResolved(): ResolutionError {
    return ResolutionError.of(
      RESOLUTION_ERRORS.ALREADY_RESOLVED,
      'The event is already resolved.',
    );
  }

  static noteTooLong(maxLength: number): ResolutionError {
    return ResolutionError.of(
      RESOLUTION_ERRORS.NOTE_TOO_LONG,
      `The resolution note cannot exceed ${maxLength} characters.`,
      { maxLength },
    );
  }

  static resolvedWithoutDate(): ResolutionError {
    return ResolutionError.of(
      RESOLUTION_ERRORS.RESOLVED_WITHOUT_DATE,
      'A resolved event must have a resolvedAt date.',
    );
  }

  static invalidResolvedAt(): ResolutionError {
    return ResolutionError.of(
      RESOLUTION_ERRORS.INVALID_RESOLVED_AT,
      'The resolvedAt must be a valid date.',
    );
  }

  static invalidStatus(value: string, allowed: readonly string[]): ResolutionError {
    return ResolutionError.of(
      RESOLUTION_ERRORS.INVALID_STATUS,
      `Invalid resolution status: "${value}".`,
      { value, allowed },
    );
  }

  private static of(
    type: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ): ResolutionError {
    return new ResolutionError({
      context: CONTEXT,
      type,
      reason,
      layer: 'domain',
      metadata,
    });
  }
}
