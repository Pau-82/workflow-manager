import type { TriggerContextInput } from '../../../domain/value-objects/trigger-context/trigger-context.vo.js';
import type { AlertEventStatus } from '../../../domain/value-objects/resolution/resolution.vo.js';

/**
 * DTO plano del evento (primitivos, preserva el discriminante del triggerContext).
 * Fechas como ISO string (JSON-friendly). Lo comparten los casos de uso que
 * devuelven un evento.
 */
export interface AlertEventDto {
  id: string;
  workflowId: string;
  triggeredAt: string;
  triggerContext: TriggerContextInput;
  renderedMessage: string;
  status: AlertEventStatus;
  resolvedAt: string | null;
  resolutionNote: string | null;
}
