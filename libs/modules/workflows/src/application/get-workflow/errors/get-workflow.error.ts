import { LayeredError, type LayeredErrorProps } from '@org/shared';
import { CONTEXT, LAYER } from '../constants/get-workflow.constants.js';

export const GET_WORKFLOW_ERRORS = {
  NOT_FOUND: 'GET_WORKFLOW_NOT_FOUND',
} as const;

/** Errores del caso de uso GetWorkflow (layer 'application'). */
export class GetWorkflowError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  /** Envuelve el NotFoundError del repositorio. El `type` contiene NOT_FOUND → 404. */
  static notFound(
    reason: string,
    metadata?: Record<string, unknown>,
  ): GetWorkflowError {
    return new GetWorkflowError({
      context: CONTEXT,
      type: GET_WORKFLOW_ERRORS.NOT_FOUND,
      reason,
      layer: LAYER,
      metadata,
    });
  }
}
