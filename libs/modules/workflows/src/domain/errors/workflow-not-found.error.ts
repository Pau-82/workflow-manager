import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'Workflow';

export const WORKFLOW_NOT_FOUND_ERRORS = {
  NOT_FOUND: 'WORKFLOW_NOT_FOUND',
} as const;

/** El workflow afirmado por un `getById` no existe. */
export class WorkflowNotFoundError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static withId(id: string): WorkflowNotFoundError {
    return new WorkflowNotFoundError({
      context: CONTEXT,
      type: WORKFLOW_NOT_FOUND_ERRORS.NOT_FOUND,
      reason: `Workflow with id "${id}" was not found.`,
      layer: 'domain',
      metadata: { id },
    });
  }
}
