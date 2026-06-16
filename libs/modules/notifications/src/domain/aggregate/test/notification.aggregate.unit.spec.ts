import { Notification } from '../notification.aggregate.js';
import type { NotificationPersistenceProps } from '../interface/notification.props.js';
import { NOTIFICATION_TARGET_ERRORS } from '../../errors/notification-target.error.js';

const VALID_ID = '33333333-3333-4333-8333-333333333333';
const VALID_EVENT_ID = '11111111-1111-4111-8111-111111111111';

function persisted(
  overrides: Partial<NotificationPersistenceProps> = {},
): NotificationPersistenceProps {
  return {
    id: VALID_ID,
    alertEventId: VALID_EVENT_ID,
    target: 'guardia',
    message: 'CPU al 95%',
    createdAt: new Date('2026-06-02T08:00:01Z'),
    ...overrides,
  };
}

describe('Notification', () => {
  describe('creación', () => {
    it('crea una notificación válida con id generado y createdAt por defecto', () => {
      const result = Notification.create({
        alertEventId: VALID_EVENT_ID,
        target: 'guardia',
        message: 'CPU al 99%',
      });
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.id.length).toBeGreaterThan(0);
        expect(result.value.alertEventId).toBe(VALID_EVENT_ID);
        expect(result.value.target).toBe('guardia');
        expect(result.value.message).toBe('CPU al 99%');
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it('rechaza un target vacío', () => {
      const result = Notification.create({
        alertEventId: VALID_EVENT_ID,
        target: '   ',
        message: 'hola',
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(NOTIFICATION_TARGET_ERRORS.EMPTY);
      }
    });

    it('rechaza una referencia de evento mal formada', () => {
      const result = Notification.create({
        alertEventId: 'no-es-uuid',
        target: 'guardia',
        message: 'hola',
      });
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('reconstitución desde persistencia', () => {
    it('reconstituye una notificación válida', () => {
      const result = Notification.fromPersistence(persisted());
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.id).toBe(VALID_ID);
        expect(result.value.alertEventId).toBe(VALID_EVENT_ID);
        expect(result.value.message).toBe('CPU al 95%');
      }
    });

    it('rechaza un id que no es UUID válido (base corrupta)', () => {
      const result = Notification.fromPersistence(
        persisted({ id: 'no-es-uuid' }),
      );
      expect(result.isFailure()).toBe(true);
    });
  });
});
