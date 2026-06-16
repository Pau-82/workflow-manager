import type { LayeredError, Result } from '@org/shared';
import type { Workflow } from '../aggregate/workflow.aggregate.js';

/** Token de inyección para el puerto (DI por interfaz en NestJS). */
export const WORKFLOW_REPOSITORY = Symbol('WorkflowRepository');

/**
 * Puerto de persistencia del agregado Workflow. La capa de aplicación depende de
 * esta interfaz, nunca de Prisma.
 *
 * Convención get/find:
 * - `getById` (afirmativo): ausencia = anomalía → `Result.fail(NotFoundError)`.
 * - `findById` (especulativo): ausencia = resultado válido → `null`.
 */
export interface IWorkflowRepository {
  /** Persiste (crea o actualiza) el workflow. */
  save(workflow: Workflow): Promise<void>;

  /** Afirmativo: devuelve `Result.fail(WorkflowNotFoundError)` si no existe. */
  getById(id: string): Promise<Result<Workflow, LayeredError>>;

  /** Especulativo: devuelve `null` si no existe. */
  findById(id: string): Promise<Workflow | null>;

  /** Lista simple: todos los workflows. */
  list(): Promise<Workflow[]>;
}
