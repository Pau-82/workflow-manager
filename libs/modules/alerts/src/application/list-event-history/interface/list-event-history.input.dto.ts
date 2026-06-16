import type { AlertEventStatus } from '../../../domain/value-objects/resolution/resolution.vo.js';

/** Input del caso de uso: filtros opcionales y combinables + paginación offset. */
export interface ListEventHistoryInput {
  workflowId?: string;
  status?: AlertEventStatus;
  page?: number;
  limit?: number;
}
