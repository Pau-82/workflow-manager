import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/activate-workflow.constants.js';

export const ACTIVATE_WORKFLOW_ERRORS = {
  NOT_FOUND: 'ACTIVATE_WORKFLOW_NOT_FOUND',
  PERSISTENCE_FAILED: 'ACTIVATE_WORKFLOW_PERSISTENCE_FAILED',
} as const;

/** Errores del caso de uso ActivateWorkflow (layer 'application'). */
export class ActivateWorkflowError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Envuelve el NotFoundError del repositorio. `type` contiene NOT_FOUND → 404. */
  static notFound(
    reason: string,
    metadata?: Record<string, unknown>,
  ): ActivateWorkflowError {
    return new ActivateWorkflowError({
      context: CONTEXT,
      type: ACTIVATE_WORKFLOW_ERRORS.NOT_FOUND,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** Falla al persistir la activación. */
  static persistenceFailed(reason: string): ActivateWorkflowError {
    return new ActivateWorkflowError({
      context: CONTEXT,
      type: ACTIVATE_WORKFLOW_ERRORS.PERSISTENCE_FAILED,
      reason,
      layer: LAYER,
    });
  }
}
