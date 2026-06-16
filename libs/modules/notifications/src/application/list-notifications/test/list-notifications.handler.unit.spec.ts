import { type Logger } from '@org/shared';
import { ListNotificationsHandler } from '../list-notifications.handler.js';
import { Notification } from '../../../domain/aggregate/notification.aggregate.js';
import { fakeNotificationRepository } from '../../../test-support/fake-notification-repository.js';

const noopLogger: Logger = {
  log: () => undefined,
  warn: () => undefined,
  debug: () => undefined,
  error: () => undefined,
  logLayeredError: () => undefined,
  logUnknownError: () => undefined,
};

const EVENT_ID = '11111111-1111-4111-8111-111111111111';

function aNotification(message: string): Notification {
  const result = Notification.create({
    alertEventId: EVENT_ID,
    target: 'guardia',
    message,
  });
  if (result.isFailure()) {
    throw new Error('fixture inválido');
  }
  return result.value;
}

describe('ListNotificationsHandler', () => {
  it('devuelve la lista de notificaciones como DTOs', async () => {
    const repository = fakeNotificationRepository({
      list: async () => [aNotification('CPU al 95%'), aNotification('CPU al 99%')],
    });
    const handler = new ListNotificationsHandler(repository, noopLogger);

    const result = await handler.execute();

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.items).toHaveLength(2);
      expect(result.value.items.map((n) => n.message)).toEqual([
        'CPU al 95%',
        'CPU al 99%',
      ]);
      expect(result.value.items[0].target).toBe('guardia');
    }
  });

  it('devuelve una lista vacía cuando no hay notificaciones', async () => {
    // El default del fake ya devuelve list → [].
    const repository = fakeNotificationRepository();
    const handler = new ListNotificationsHandler(repository, noopLogger);

    const result = await handler.execute();

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.items).toEqual([]);
    }
  });
});
