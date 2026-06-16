import type { AlertEvent, AlertEventStatus } from '../aggregate/alert-event.aggregate.js';

/** Token de inyección para el puerto (DI por interfaz en NestJS). */
export const ALERT_EVENT_REPOSITORY = Symbol('AlertEventRepository');

/** Filtros opcionales y combinables del historial de eventos. */
export interface EventHistoryFilters {
  workflowId?: string;
  status?: AlertEventStatus;
}

/** Consulta paginada del historial: filtros + ventana offset. */
export interface EventHistoryQuery extends EventHistoryFilters {
  offset: number;
  limit: number;
}

/**
 * Puerto de persistencia del agregado AlertEvent. La capa de aplicación depende de
 * esta interfaz, nunca de Prisma. Este vertical sólo necesita lectura paginada;
 * verticales posteriores agregarán save / findOpenEventByWorkflow.
 */
export interface IAlertEventRepository {
  /** Página de eventos: orden DESC por triggeredAt, desempate estable por id. */
  history(query: EventHistoryQuery): Promise<AlertEvent[]>;

  /** Total de eventos que matchean los filtros (para la paginación). */
  count(filters: EventHistoryFilters): Promise<number>;
}
