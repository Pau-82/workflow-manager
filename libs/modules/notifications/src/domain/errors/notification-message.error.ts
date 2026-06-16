import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'NotificationMessage';

export const NOTIFICATION_MESSAGE_ERRORS = {
  EMPTY: 'NOTIFICATION_MESSAGE_EMPTY',
  TOO_LONG: 'NOTIFICATION_MESSAGE_TOO_LONG',
} as const;

export class NotificationMessageError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static empty(): NotificationMessageError {
    return new NotificationMessageError({
      context: CONTEXT,
      type: NOTIFICATION_MESSAGE_ERRORS.EMPTY,
      reason: 'The notification message cannot be empty.',
      layer: 'domain',
    });
  }

  static tooLong(maxLength: number): NotificationMessageError {
    return new NotificationMessageError({
      context: CONTEXT,
      type: NOTIFICATION_MESSAGE_ERRORS.TOO_LONG,
      reason: `The notification message cannot exceed ${maxLength} characters.`,
      layer: 'domain',
      metadata: { maxLength },
    });
  }
}
