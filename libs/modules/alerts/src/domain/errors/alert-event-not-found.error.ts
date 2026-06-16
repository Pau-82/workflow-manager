import { LayeredError, type LayeredErrorProps } from '@org/shared';

const CONTEXT = 'AlertEvent';

export const ALERT_EVENT_NOT_FOUND_ERRORS = {
  NOT_FOUND: 'ALERT_EVENT_NOT_FOUND',
} as const;

/** El evento afirmado por un `getById` no existe. */
export class AlertEventNotFoundError extends LayeredError {
  private constructor(props: LayeredErrorProps) {
    super(props);
  }

  static withId(id: string): AlertEventNotFoundError {
    return new AlertEventNotFoundError({
      context: CONTEXT,
      type: ALERT_EVENT_NOT_FOUND_ERRORS.NOT_FOUND,
      reason: `Alert event with id "${id}" was not found.`,
      layer: 'domain',
      metadata: { id },
    });
  }
}
