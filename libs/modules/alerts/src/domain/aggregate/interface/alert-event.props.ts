import type { TriggerContextInput } from '../../value-objects/trigger-context/trigger-context.vo.js';

/** Input crudo para registrar un disparo nuevo (sin id ni status: nace 'abierto'). */
export interface CreateAlertEventProps {
  workflowId: string;
  triggerContext: TriggerContextInput;
  renderedMessage: string;
  /** Momento del disparo. Por defecto, ahora. */
  triggeredAt?: Date;
}

/** Snapshot crudo para reconstituir un evento desde persistencia. */
export interface AlertEventPersistenceProps {
  id: string;
  workflowId: string;
  triggeredAt: Date;
  triggerContext: TriggerContextInput;
  renderedMessage: string;
  status: string;
  resolvedAt: Date | null;
  resolutionNote: string | null;
}
