import { Result, type LayeredError } from '@org/shared';
import { ResolutionError } from '../../errors/resolution.error.js';
import { OpenResolution } from './open-resolution.vo.js';
import { ResolvedResolution } from './resolved-resolution.vo.js';

// Re-export de las variantes: un único punto de entrada (el VO "Resolution").
export * from './open-resolution.vo.js';
export * from './resolved-resolution.vo.js';

export const ALERT_EVENT_STATUSES = ['abierto', 'resuelto'] as const;
export type AlertEventStatus = (typeof ALERT_EVENT_STATUSES)[number];

/**
 * Estado de resolución del evento como UNIÓN DISCRIMINADA. La invariante cruzada
 * (resuelto ⇒ tiene fecha; abierto ⇒ sin fecha/nota) es ESTRUCTURAL: cada variante
 * sólo puede llevar lo que le corresponde, así que es imposible representar un
 * estado inválido. La transición vive acá (en las variantes), no en el agregado.
 */
export type Resolution = OpenResolution | ResolvedResolution;

/** Primitivos crudos para reconstituir el estado desde persistencia. */
export interface ResolutionPrimitives {
  status: string;
  resolvedAt: Date | null;
  note: string | null;
}

export const Resolution = {
  /** Nace abierto. */
  open(): OpenResolution {
    return OpenResolution.create();
  },

  /** Reconstituye el estado desde primitivos (status + resolvedAt + note), validando. */
  create(raw: ResolutionPrimitives): Result<Resolution, LayeredError> {
    switch (raw.status) {
      case 'abierto':
        return Result.ok<Resolution>(OpenResolution.create());
      case 'resuelto': {
        if (!raw.resolvedAt) {
          return Result.fail<Resolution>(ResolutionError.resolvedWithoutDate());
        }
        const result = ResolvedResolution.create(raw.resolvedAt, raw.note);
        return result.isFailure()
          ? Result.fail<Resolution>(result.error)
          : Result.ok<Resolution>(result.value);
      }
      default:
        return Result.fail<Resolution>(
          ResolutionError.invalidStatus(raw.status, ALERT_EVENT_STATUSES),
        );
    }
  },
};
