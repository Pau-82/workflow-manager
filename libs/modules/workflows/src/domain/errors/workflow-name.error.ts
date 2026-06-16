import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'WorkflowName';

export const WORKFLOW_NAME_ERRORS = {
  EMPTY: 'WORKFLOW_NAME_EMPTY',
  TOO_LONG: 'WORKFLOW_NAME_TOO_LONG',
} as const;

export class WorkflowNameError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static empty(): WorkflowNameError {
    return new WorkflowNameError({
      context: CONTEXT,
      type: WORKFLOW_NAME_ERRORS.EMPTY,
      reason: 'The workflow name cannot be empty.',
      layer: 'domain',
    });
  }

  static tooLong(maxLength: number): WorkflowNameError {
    return new WorkflowNameError({
      context: CONTEXT,
      type: WORKFLOW_NAME_ERRORS.TOO_LONG,
      reason: `The workflow name cannot exceed ${maxLength} characters.`,
      layer: 'domain',
      metadata: { maxLength },
    });
  }
}
