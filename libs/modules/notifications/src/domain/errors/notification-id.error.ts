import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'NotificationId';

export const NOTIFICATION_ID_ERRORS = {
  INVALID: 'NOTIFICATION_ID_INVALID',
} as const;

export class NotificationIdError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static invalid(value: string): NotificationIdError {
    return new NotificationIdError({
      context: CONTEXT,
      type: NOTIFICATION_ID_ERRORS.INVALID,
      reason: `Invalid notification id: "${value}".`,
      layer: 'domain',
      metadata: { value },
    });
  }
}
