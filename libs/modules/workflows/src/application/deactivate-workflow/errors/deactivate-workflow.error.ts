import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/deactivate-workflow.constants.js';

export const DEACTIVATE_WORKFLOW_ERRORS = {
  NOT_FOUND: 'DEACTIVATE_WORKFLOW_NOT_FOUND',
  PERSISTENCE_FAILED: 'DEACTIVATE_WORKFLOW_PERSISTENCE_FAILED',
} as const;

/** Errores del caso de uso DeactivateWorkflow (layer 'application'). */
export class DeactivateWorkflowError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Envuelve el NotFoundError del repositorio. `type` contiene NOT_FOUND → 404. */
  static notFound(
    reason: string,
    metadata?: Record<string, unknown>,
  ): DeactivateWorkflowError {
    return new DeactivateWorkflowError({
      context: CONTEXT,
      type: DEACTIVATE_WORKFLOW_ERRORS.NOT_FOUND,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** Falla al persistir la desactivación. */
  static persistenceFailed(reason: string): DeactivateWorkflowError {
    return new DeactivateWorkflowError({
      context: CONTEXT,
      type: DEACTIVATE_WORKFLOW_ERRORS.PERSISTENCE_FAILED,
      reason,
      layer: LAYER,
    });
  }
}
