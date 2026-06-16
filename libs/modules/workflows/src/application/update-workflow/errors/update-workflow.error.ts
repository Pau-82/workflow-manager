import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/update-workflow.constants.js';

export const UPDATE_WORKFLOW_ERRORS = {
  NOT_FOUND: 'UPDATE_WORKFLOW_NOT_FOUND',
  INVALID_INPUT: 'UPDATE_WORKFLOW_INVALID_INPUT',
  PERSISTENCE_FAILED: 'UPDATE_WORKFLOW_PERSISTENCE_FAILED',
} as const;

/** Errores del caso de uso UpdateWorkflow (layer 'application'). */
export class UpdateWorkflowError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Envuelve el NotFoundError del repositorio. `type` contiene NOT_FOUND → 404. */
  static notFound(
    reason: string,
    metadata?: Record<string, unknown>,
  ): UpdateWorkflowError {
    return new UpdateWorkflowError({
      context: CONTEXT,
      type: UPDATE_WORKFLOW_ERRORS.NOT_FOUND,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** Envuelve el/los error(es) de dominio al reconfigurar el agregado. */
  static invalidInput(
    reason: string,
    metadata?: Record<string, unknown>,
  ): UpdateWorkflowError {
    return new UpdateWorkflowError({
      context: CONTEXT,
      type: UPDATE_WORKFLOW_ERRORS.INVALID_INPUT,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** Falla al persistir la actualización. */
  static persistenceFailed(reason: string): UpdateWorkflowError {
    return new UpdateWorkflowError({
      context: CONTEXT,
      type: UPDATE_WORKFLOW_ERRORS.PERSISTENCE_FAILED,
      reason,
      layer: LAYER,
    });
  }
}
