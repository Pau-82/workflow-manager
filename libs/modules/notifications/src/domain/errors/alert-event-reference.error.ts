import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'AlertEventReference';

export const ALERT_EVENT_REFERENCE_ERRORS = {
  INVALID: 'ALERT_EVENT_REFERENCE_INVALID',
} as const;

export class AlertEventReferenceError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static invalid(value: string): AlertEventReferenceError {
    return new AlertEventReferenceError({
      context: CONTEXT,
      type: ALERT_EVENT_REFERENCE_ERRORS.INVALID,
      reason: `Invalid alert event reference: "${value}".`,
      layer: 'domain',
      metadata: { value },
    });
  }
}
