import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'Workflow';

export const WORKFLOW_ERRORS = {
  NO_RECIPIENTS: 'WORKFLOW_NO_RECIPIENTS',
  INVALID_COMPOSITION: 'WORKFLOW_INVALID_COMPOSITION',
} as const;

/** Errores de invariante del agregado Workflow (a nivel raíz, no de un VO). */
export class WorkflowError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static noRecipients(): WorkflowError {
    return new WorkflowError({
      context: CONTEXT,
      type: WORKFLOW_ERRORS.NO_RECIPIENTS,
      reason: 'A workflow must have at least one recipient.',
      layer: 'domain',
    });
  }

  /**
   * Agrega todos los errores de construcción de los VOs en uno solo, sin perder
   * detalle (cada uno queda en metadata.errors). Lo usa Workflow.create cuando
   * Result.combine devuelve más de un error.
   */
  static invalidComposition(errors: readonly LayeredError[]): WorkflowError {
    return new WorkflowError({
      context: CONTEXT,
      type: WORKFLOW_ERRORS.INVALID_COMPOSITION,
      reason: errors.map((e) => e.reason).join(' '),
      layer: 'domain',
      metadata: {
        errors: errors.map((e) => ({
          context: e.context,
          type: e.type,
          reason: e.reason,
        })),
      },
    });
  }
}
