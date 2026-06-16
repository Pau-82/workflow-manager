import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'AlertEventId';

export const ALERT_EVENT_ID_ERRORS = {
  INVALID: 'ALERT_EVENT_ID_INVALID',
} as const;

export class AlertEventIdError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static invalid(value: string): AlertEventIdError {
    return new AlertEventIdError({
      context: CONTEXT,
      type: ALERT_EVENT_ID_ERRORS.INVALID,
      reason: `Invalid alert event id: "${value}".`,
      layer: 'domain',
      metadata: { value },
    });
  }
}
