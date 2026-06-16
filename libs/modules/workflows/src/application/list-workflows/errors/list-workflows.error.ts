import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/list-workflows.constants.js';

export const LIST_WORKFLOWS_ERRORS = {
  PERSISTENCE_FAILED: 'LIST_WORKFLOWS_PERSISTENCE_FAILED',
} as const;

/** Errores del caso de uso ListWorkflows (layer 'application'). */
export class ListWorkflowsError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Falla al leer los workflows del repositorio. */
  static persistenceFailed(reason: string): ListWorkflowsError {
    return new ListWorkflowsError({
      context: CONTEXT,
      type: LIST_WORKFLOWS_ERRORS.PERSISTENCE_FAILED,
      reason,
      layer: LAYER,
    });
  }
}
