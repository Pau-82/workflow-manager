import { Result } from '@org/shared';
import type { AlertEvent } from '../domain/aggregate/alert-event.aggregate.js';
import { AlertEventNotFoundError } from '../domain/errors/alert-event-not-found.error.js';
import type { IAlertEventRepository } from '../domain/ports/alert-event.repository.port.js';

/**
 * Fake de IAlertEventRepository para tests. Defaults "pesimistas" (history → vacío,
 * count → 0, getById → NotFound) para que un test que olvide configurar un método
 * falle fuerte en vez de pasar en falso. Cada test sobreescribe lo que le importa.
 *
 * NO es parte del build de la lib (ver `exclude` en tsconfig.lib.json).
 */
export function fakeAlertEventRepository(
  overrides: Partial<IAlertEventRepository> = {},
): IAlertEventRepository {
  return {
    history: async () => [],
    count: async () => 0,
    getById: async (id) =>
      Result.fail<AlertEvent>(AlertEventNotFoundError.withId(id)),
    update: async () => undefined,
    ...overrides,
  };
}
