import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/create-workflow.constants.js';

export const CREATE_WORKFLOW_ERRORS = {
  INVALID_INPUT: 'CREATE_WORKFLOW_INVALID_INPUT',
  PERSISTENCE_FAILED: 'CREATE_WORKFLOW_PERSISTENCE_FAILED',
} as const;

/** Errores del caso de uso CreateWorkflow (layer 'application'). */
export class CreateWorkflowError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Envuelve el/los error(es) de dominio al construir el agregado. */
  static invalidInput(
    reason: string,
    metadata?: Record<string, unknown>,
  ): CreateWorkflowError {
    return new CreateWorkflowError({
      context: CONTEXT,
      type: CREATE_WORKFLOW_ERRORS.INVALID_INPUT,
      reason,
      layer: LAYER,
      metadata,
    });
  }

  /** Falla al persistir el workflow. */
  static persistenceFailed(reason: string): CreateWorkflowError {
    return new CreateWorkflowError({
      context: CONTEXT,
      type: CREATE_WORKFLOW_ERRORS.PERSISTENCE_FAILED,
      reason,
      layer: LAYER,
    });
  }
}
