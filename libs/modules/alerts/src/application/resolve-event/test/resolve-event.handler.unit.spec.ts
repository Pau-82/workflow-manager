import { Result, type Logger } from '@org/shared';
import { ResolveEventHandler } from '../resolve-event.handler.js';
import { RESOLVE_EVENT_ERRORS } from '../errors/resolve-event.error.js';
import { AlertEvent } from '../../../domain/aggregate/alert-event.aggregate.js';
import type { AlertEventPersistenceProps } from '../../../domain/aggregate/interface/alert-event.props.js';
import { fakeAlertEventRepository } from '../../../test-support/fake-alert-event-repository.js';

const noopLogger: Logger = {
  log: () => undefined,
  warn: () => undefined,
  debug: () => undefined,
  error: () => undefined,
  logLayeredError: () => undefined,
  logUnknownError: () => undefined,
};

const EVENT_ID = '33333333-3333-4333-8333-333333333333';
const WORKFLOW_ID = '11111111-1111-4111-8111-111111111111';

function anEvent(
  overrides: Partial<AlertEventPersistenceProps> = {},
): AlertEvent {
  const raw: AlertEventPersistenceProps = {
    id: EVENT_ID,
    workflowId: WORKFLOW_ID,
    triggeredAt: new Date('2026-06-01T08:00:00Z'),
    triggerContext: {
      type: 'threshold',
      metricName: 'cpu',
      operator: '>',
      threshold: 90,
      observedValue: 95,
    },
    renderedMessage: 'CPU al 95%',
    status: 'abierto',
    resolvedAt: null,
    resolutionNote: null,
    ...overrides,
  };
  const result = AlertEvent.fromPersistence(raw);
  if (result.isFailure()) {
    throw new Error('fixture inválido: ' + result.error.reason);
  }
  return result.value;
}

describe('ResolveEventHandler', () => {
  it('resuelve un evento abierto y devuelve el DTO con status resuelto', async () => {
    const event = anEvent();
    const repository = fakeAlertEventRepository({
      getById: async () => Result.ok(event),
    });
    const handler = new ResolveEventHandler(repository, noopLogger);

    const result = await handler.execute({ eventId: EVENT_ID, note: 'cerrado' });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.id).toBe(EVENT_ID);
      expect(result.value.status).toBe('resuelto');
      expect(result.value.resolvedAt).not.toBeNull();
      expect(result.value.resolutionNote).toBe('cerrado');
    }
  });

  it('devuelve NOT_FOUND cuando el evento no existe', async () => {
    // El default del fake ya devuelve getById → NotFound.
    const repository = fakeAlertEventRepository();
    const handler = new ResolveEventHandler(repository, noopLogger);

    const result = await handler.execute({ eventId: 'inexistente' });

    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(RESOLVE_EVENT_ERRORS.NOT_FOUND);
    }
  });

  it('devuelve ALREADY_RESOLVED cuando el evento ya estaba resuelto', async () => {
    const resolved = anEvent({
      status: 'resuelto',
      resolvedAt: new Date('2026-06-02T10:00:00Z'),
      resolutionNote: 'ya cerrado',
    });
    const repository = fakeAlertEventRepository({
      getById: async () => Result.ok(resolved),
    });
    const handler = new ResolveEventHandler(repository, noopLogger);

    const result = await handler.execute({ eventId: EVENT_ID, note: 'otra vez' });

    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(RESOLVE_EVENT_ERRORS.ALREADY_RESOLVED);
    }
  });
});
