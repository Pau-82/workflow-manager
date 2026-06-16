import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'WorkflowId';

export const WORKFLOW_ID_ERRORS = {
  INVALID: 'WORKFLOW_ID_INVALID',
} as const;

export class WorkflowIdError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static invalid(value: string): WorkflowIdError {
    return new WorkflowIdError({
      context: CONTEXT,
      type: WORKFLOW_ID_ERRORS.INVALID,
      reason: `Invalid workflow id: "${value}".`,
      layer: 'domain',
      metadata: { value },
    });
  }
}
