import { Recipient, type RecipientInput } from '../recipient.vo.js';
import { RECIPIENT_ERRORS } from '../../errors/recipient.error.js';

describe('Recipient', () => {
  it('acepta un email válido y lo recorta', () => {
    const result = Recipient.create({ channel: 'email', address: '  a@b.com  ' });
    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess() && result.value.channel === 'email') {
      expect(result.value.address).toBe('a@b.com');
    }
  });

  it('rechaza un email con formato inválido', () => {
    const result = Recipient.create({ channel: 'email', address: 'no-es-email' });
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(RECIPIENT_ERRORS.INVALID_EMAIL);
    }
  });

  it('acepta un destino in-app no vacío', () => {
    const result = Recipient.create({ channel: 'in-app', target: '  soporte  ' });
    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess() && result.value.channel === 'in-app') {
      expect(result.value.target).toBe('soporte');
    }
  });

  it('rechaza un destino in-app vacío', () => {
    const result = Recipient.create({ channel: 'in-app', target: '   ' });
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(RECIPIENT_ERRORS.EMPTY_TARGET);
    }
  });

  it('rechaza un canal desconocido', () => {
    const result = Recipient.create({
      channel: 'sms',
      target: 'x',
    } as unknown as RecipientInput);
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(RECIPIENT_ERRORS.UNKNOWN_CHANNEL);
    }
  });
});
