import type { LayeredError, Result } from '@org/shared';
import type { AlertEvent } from '../aggregate/alert-event.aggregate.js';
import type { AlertEventStatus } from '../value-objects/resolution/resolution.vo.js';

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
 * esta interfaz, nunca de Prisma. Verticales posteriores agregarán save /
 * findOpenEventByWorkflow.
 *
 * Convención get/find: `getById` (afirmativo) → `Result.fail(NotFound)` si no existe.
 */
export interface IAlertEventRepository {
  /** Página de eventos: orden DESC por triggeredAt, desempate estable por id. */
  history(query: EventHistoryQuery): Promise<AlertEvent[]>;

  /** Total de eventos que matchean los filtros (para la paginación). */
  count(filters: EventHistoryFilters): Promise<number>;

  /** Afirmativo: devuelve `Result.fail(AlertEventNotFoundError)` si no existe. */
  getById(id: string): Promise<Result<AlertEvent, LayeredError>>;

  /**
   * Inserta un evento nuevo. Acepta un cliente transaccional OPACO opcional (`tx`)
   * para participar de un UnitOfWork externo (lo usa SimulateTrigger en el V10).
   */
  save(event: AlertEvent, tx?: unknown): Promise<void>;

  /** Persiste los cambios de un evento existente (hoy, su estado de resolución). */
  update(event: AlertEvent): Promise<void>;
}
