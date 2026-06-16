import { NotificationMessage } from '../notification-message.vo.js';
import { NOTIFICATION_MESSAGE_ERRORS } from '../../errors/notification-message.error.js';

describe('NotificationMessage', () => {
  it('acepta un texto no vacío (y lo recorta)', () => {
    const result = NotificationMessage.create('  CPU al 95%  ');
    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.message).toBe('CPU al 95%');
    }
  });

  it('rechaza un mensaje vacío', () => {
    const result = NotificationMessage.create('   ');
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(NOTIFICATION_MESSAGE_ERRORS.EMPTY);
    }
  });

  it('rechaza un mensaje demasiado largo', () => {
    const result = NotificationMessage.create('x'.repeat(501));
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(NOTIFICATION_MESSAGE_ERRORS.TOO_LONG);
    }
  });
});
