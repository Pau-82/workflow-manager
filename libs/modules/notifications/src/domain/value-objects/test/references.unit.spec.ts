import { NotificationId } from '../notification-id.vo.js';
import { AlertEventReference } from '../alert-event-reference.vo.js';
import { NOTIFICATION_ID_ERRORS } from '../../errors/notification-id.error.js';
import { ALERT_EVENT_REFERENCE_ERRORS } from '../../errors/alert-event-reference.error.js';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('NotificationId', () => {
  it('genera un UUID válido', () => {
    const id = NotificationId.generate();
    expect(NotificationId.create(id.value).isSuccess()).toBe(true);
  });

  it('reconstituye desde un UUID válido', () => {
    const result = NotificationId.create(VALID_UUID);
    expect(result.isSuccess()).toBe(true);
  });

  it('rechaza un id mal formado', () => {
    const result = NotificationId.create('no-es-uuid');
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(NOTIFICATION_ID_ERRORS.INVALID);
    }
  });
});

describe('AlertEventReference', () => {
  it('acepta una referencia con formato UUID válido', () => {
    const result = AlertEventReference.create(VALID_UUID);
    expect(result.isSuccess()).toBe(true);
  });

  it('rechaza una referencia mal formada', () => {
    const result = AlertEventReference.create('123');
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(ALERT_EVENT_REFERENCE_ERRORS.INVALID);
    }
  });
});
