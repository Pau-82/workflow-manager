import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'Recipient';

export const RECIPIENT_ERRORS = {
  INVALID_EMAIL: 'RECIPIENT_INVALID_EMAIL',
  EMPTY_TARGET: 'RECIPIENT_EMPTY_TARGET',
  UNKNOWN_CHANNEL: 'RECIPIENT_UNKNOWN_CHANNEL',
} as const;

export class RecipientError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static invalidEmail(value: string): RecipientError {
    return new RecipientError({
      context: CONTEXT,
      type: RECIPIENT_ERRORS.INVALID_EMAIL,
      reason: `Invalid email address: "${value}".`,
      layer: 'domain',
      metadata: { value },
    });
  }

  static emptyTarget(): RecipientError {
    return new RecipientError({
      context: CONTEXT,
      type: RECIPIENT_ERRORS.EMPTY_TARGET,
      reason: 'The in-app target cannot be empty.',
      layer: 'domain',
    });
  }

  static unknownChannel(value: string): RecipientError {
    return new RecipientError({
      context: CONTEXT,
      type: RECIPIENT_ERRORS.UNKNOWN_CHANNEL,
      reason: `Unknown recipient channel: "${value}".`,
      layer: 'domain',
      metadata: { value },
    });
  }
}
