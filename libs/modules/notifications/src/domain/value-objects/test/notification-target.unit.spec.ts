import { NotificationTarget } from '../notification-target.vo.js';
import { NOTIFICATION_TARGET_ERRORS } from '../../errors/notification-target.error.js';

describe('NotificationTarget', () => {
  it('acepta un identificador libre no vacío (y lo recorta)', () => {
    const result = NotificationTarget.create('  guardia  ');
    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.target).toBe('guardia');
    }
  });

  it('rechaza un target vacío', () => {
    const result = NotificationTarget.create('   ');
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(NOTIFICATION_TARGET_ERRORS.EMPTY);
    }
  });

  it('rechaza un target demasiado largo', () => {
    const result = NotificationTarget.create('x'.repeat(201));
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(NOTIFICATION_TARGET_ERRORS.TOO_LONG);
    }
  });
});
