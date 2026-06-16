import type { INotificationRepository } from '../domain/ports/notification.repository.port.js';

/**
 * Fake de INotificationRepository para tests. Defaults "pesimistas" (list → vacío)
 * para que un test que olvide configurar un método falle fuerte en vez de pasar en
 * falso. Cada test sobreescribe lo que le importa.
 *
 * NO es parte del build de la lib (ver `exclude` en tsconfig.lib.json).
 */
export function fakeNotificationRepository(
  overrides: Partial<INotificationRepository> = {},
): INotificationRepository {
  return {
    save: async () => undefined,
    list: async () => [],
    ...overrides,
  };
}
