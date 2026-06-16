import { Result, type LayeredError } from '@org/shared';
import { TriggerContextError } from '../../errors/trigger-context.error.js';
import {
  ThresholdContext,
  type ThresholdContextInput,
} from './threshold-context.vo.js';
import {
  VarianceContext,
  type VarianceContextInput,
} from './variance-context.vo.js';

// Re-export de las variantes para que los consumidores tengan un único punto de
// entrada (el snapshot "TriggerContext") sin importar cada archivo por separado.
export * from './threshold-context.vo.js';
export * from './variance-context.vo.js';

export type TriggerContextInput = ThresholdContextInput | VarianceContextInput;

/**
 * Snapshot CONGELADO que explica un disparo (lo que se guarda en el evento, auto-
 * contenido). Union discriminada por `type`. NO evalúa la condición: sólo registra
 * lo que pasó. Mismo molde de VO que workflows (constructor privado, create => Result).
 */
export type TriggerContext = ThresholdContext | VarianceContext;

/** Factory que discrimina por `type` y delega en la variante correcta. */
export const TriggerContext = {
  create(raw: TriggerContextInput): Result<TriggerContext, LayeredError> {
    switch (raw.type) {
      case 'threshold':
        return ThresholdContext.create(raw);
      case 'variance':
        return VarianceContext.create(raw);
      default:
        return Result.fail<TriggerContext>(
          TriggerContextError.unknownType((raw as { type: string }).type),
        );
    }
  },
};
