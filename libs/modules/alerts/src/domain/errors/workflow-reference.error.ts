import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'WorkflowReference';

export const WORKFLOW_REFERENCE_ERRORS = {
  INVALID: 'WORKFLOW_REFERENCE_INVALID',
} as const;

export class WorkflowReferenceError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static invalid(value: string): WorkflowReferenceError {
    return new WorkflowReferenceError({
      context: CONTEXT,
      type: WORKFLOW_REFERENCE_ERRORS.INVALID,
      reason: `Invalid workflow reference: "${value}".`,
      layer: 'domain',
      metadata: { value },
    });
  }
}
