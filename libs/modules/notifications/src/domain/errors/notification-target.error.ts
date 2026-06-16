import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'NotificationTarget';

export const NOTIFICATION_TARGET_ERRORS = {
  EMPTY: 'NOTIFICATION_TARGET_EMPTY',
  TOO_LONG: 'NOTIFICATION_TARGET_TOO_LONG',
} as const;

export class NotificationTargetError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static empty(): NotificationTargetError {
    return new NotificationTargetError({
      context: CONTEXT,
      type: NOTIFICATION_TARGET_ERRORS.EMPTY,
      reason: 'The notification target cannot be empty.',
      layer: 'domain',
    });
  }

  static tooLong(maxLength: number): NotificationTargetError {
    return new NotificationTargetError({
      context: CONTEXT,
      type: NOTIFICATION_TARGET_ERRORS.TOO_LONG,
      reason: `The notification target cannot exceed ${maxLength} characters.`,
      layer: 'domain',
      metadata: { maxLength },
    });
  }
}
