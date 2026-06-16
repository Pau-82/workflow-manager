import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'AlertEvent';

export const DUPLICATE_OPEN_EVENT_ERRORS = {
  DUPLICATE: 'ALERT_EVENT_DUPLICATE_OPEN',
} as const;

/**
 * Ya existe un evento ABIERTO para el workflow (lo detecta el índice único parcial
 * de Postgres ante una carrera: P2002). El repo lo lanza tipado para que el handler
 * lo distinga de un fallo genérico y lo traduzca a "duplicado" (no es un error 5xx).
 */
export class DuplicateOpenEventError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static forWorkflow(workflowId: string): DuplicateOpenEventError {
    return new DuplicateOpenEventError({
      context: CONTEXT,
      type: DUPLICATE_OPEN_EVENT_ERRORS.DUPLICATE,
      reason: `Workflow "${workflowId}" already has an open alert event.`,
      layer: 'domain',
      metadata: { workflowId },
    });
  }
}
