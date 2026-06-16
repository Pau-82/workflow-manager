import { Result, StringValueObject, type LayeredError } from '@org/shared';
import { RecipientError } from '../errors/recipient.error.js';

// Validación de email pragmática; la forma estricta vive en contracts (Zod).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailRecipientInput {
  channel: 'email';
  address: string;
}
export interface InAppRecipientInput {
  channel: 'in-app';
  target: string;
}
export type RecipientInput = EmailRecipientInput | InAppRecipientInput;

/** Destinatario individual: union discriminada por `channel`. */
export type Recipient = EmailRecipient | InAppRecipient;

export class EmailRecipient extends StringValueObject {
  readonly channel = 'email' as const;

  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<EmailRecipient, LayeredError> {
    const sanitized = (raw ?? '').trim();
    if (!EMAIL_REGEX.test(sanitized)) {
      return Result.fail<EmailRecipient>(RecipientError.invalidEmail(raw));
    }
    return Result.ok(new EmailRecipient(sanitized));
  }

  get address(): string {
    return this.value;
  }
}

export class InAppRecipient extends StringValueObject {
  readonly channel = 'in-app' as const;

  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<InAppRecipient, LayeredError> {
    const sanitized = (raw ?? '').trim();
    if (sanitized.length === 0) {
      return Result.fail<InAppRecipient>(RecipientError.emptyTarget());
    }
    return Result.ok(new InAppRecipient(sanitized));
  }

  get target(): string {
    return this.value;
  }
}

/** Factory que discrimina por canal y delega en la variante correcta. */
export const Recipient = {
  create(raw: RecipientInput): Result<Recipient, LayeredError> {
    switch (raw.channel) {
      case 'email':
        return EmailRecipient.create(raw.address);
      case 'in-app':
        return InAppRecipient.create(raw.target);
      default:
        return Result.fail<Recipient>(
          RecipientError.unknownChannel((raw as { channel: string }).channel),
        );
    }
  },
};
