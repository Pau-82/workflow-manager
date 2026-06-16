import type { Result, LayeredError } from '@org/shared';
import { ResolvedResolution } from './resolved-resolution.vo.js';

/** Estado de resolución ABIERTO: sin fecha ni nota (estructuralmente imposible tenerlas). */
export class OpenResolution {
  readonly status = 'abierto' as const;

  private constructor() {}

  /** Nace abierto. No puede fallar (no tiene datos que validar). */
  static create(): OpenResolution {
    return new OpenResolution();
  }

  /**
   * Transición abierto → resuelto: sella la fecha (ahora) y la nota normalizada/validada.
   * Delega la validación de la nota en ResolvedResolution.create.
   */
  resolve(note?: string | null): Result<ResolvedResolution, LayeredError> {
    return ResolvedResolution.create(new Date(), note ?? null);
  }

  isOpen(): boolean {
    return true;
  }
  isResolved(): boolean {
    return false;
  }

  get resolvedAt(): Date | null {
    return null;
  }
  get note(): string | null {
    return null;
  }
}
