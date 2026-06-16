import type { AlertEventStatus } from '../../../domain/aggregate/alert-event.aggregate.js';

/** Input del caso de uso: filtros opcionales y combinables + paginación offset. */
export interface ListEventHistoryInput {
  workflowId?: string;
  status?: AlertEventStatus;
  page?: number;
  limit?: number;
}
