import { Result } from '@org/shared';
import { Workflow } from '../domain/aggregate/workflow.aggregate.js';
import { WorkflowNotFoundError } from '../domain/errors/workflow-not-found.error.js';
import type { IWorkflowRepository } from '../domain/ports/workflow.repository.port.js';

/**
 * Fake de IWorkflowRepository para tests. Defaults "pesimistas" (getById →
 * NotFound, list → vacío) para que un test que olvide configurar un método
 * falle fuerte en vez de pasar en falso. Cada test sobreescribe lo que le importa.
 *
 * NO es parte del build de la lib (ver `exclude` en tsconfig.lib.json).
 */
export function fakeWorkflowRepository(
  overrides: Partial<IWorkflowRepository> = {},
): IWorkflowRepository {
  return {
    save: async () => undefined,
    update: async () => undefined,
    getById: async (id) => Result.fail<Workflow>(WorkflowNotFoundError.withId(id)),
    findById: async () => null,
    list: async () => [],
    ...overrides,
  };
}
