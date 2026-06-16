import { Result, type LayeredError } from '@org/shared';
import { ResolutionError } from '../../errors/resolution.error.js';

/** Tope de longitud de la nota de resolución (vivía en el agregado; ahora es del VO). */
export const MAX_RESOLUTION_NOTE_LENGTH = 300;

/** Normaliza la nota: trim; cadena vacía => null. */
export function normalizeResolutionNote(note: string | null | undefined): string | null {
  const trimmed = (note ?? '').trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Estado de resolución RESUELTO: tiene fecha sí o sí y, opcionalmente, una nota. */
export class ResolvedResolution {
  readonly status = 'resuelto' as const;

  private constructor(
    private readonly _resolvedAt: Date,
    private readonly _note: string | null,
  ) {}

  /**
   * Construye un estado resuelto validando la fecha y normalizando/validando la nota.
   * Lo usan tanto la transición `resolve()` como la reconstitución desde persistencia.
   */
  static create(
    resolvedAt: Date,
    note: string | null,
  ): Result<ResolvedResolution, LayeredError> {
    if (!(resolvedAt instanceof Date) || Number.isNaN(resolvedAt.getTime())) {
      return Result.fail<ResolvedResolution>(
        ResolutionError.invalidResolvedAt(),
      );
    }
    const normalized = normalizeResolutionNote(note);
    if (normalized && normalized.length > MAX_RESOLUTION_NOTE_LENGTH) {
      return Result.fail<ResolvedResolution>(
        ResolutionError.noteTooLong(MAX_RESOLUTION_NOTE_LENGTH),
      );
    }
    return Result.ok(new ResolvedResolution(resolvedAt, normalized));
  }

  /** Ya está resuelto: resolver de nuevo es un conflicto. (Firma igual que OpenResolution.) */
  resolve(_note?: string | null): Result<ResolvedResolution, LayeredError> {
    return Result.fail<ResolvedResolution>(ResolutionError.alreadyResolved());
  }

  isOpen(): boolean {
    return false;
  }
  isResolved(): boolean {
    return true;
  }

  get resolvedAt(): Date | null {
    return this._resolvedAt;
  }
  get note(): string | null {
    return this._note;
  }
}
