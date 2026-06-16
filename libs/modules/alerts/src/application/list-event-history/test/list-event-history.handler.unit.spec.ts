import { type Logger } from '@org/shared';
import { ListEventHistoryHandler } from '../list-event-history.handler.js';
import { AlertEvent } from '../../../domain/aggregate/alert-event.aggregate.js';
import type { AlertEventPersistenceProps } from '../../../domain/aggregate/interface/alert-event.props.js';
import type { EventHistoryQuery } from '../../../domain/ports/alert-event.repository.port.js';
import { fakeAlertEventRepository } from '../../../test-support/fake-alert-event-repository.js';

const noopLogger: Logger = {
  log: () => undefined,
  warn: () => undefined,
  debug: () => undefined,
  error: () => undefined,
  logLayeredError: () => undefined,
  logUnknownError: () => undefined,
};

const WORKFLOW_ID = '11111111-1111-4111-8111-111111111111';

let idCounter = 0;
function anEvent(triggeredAt: string): AlertEvent {
  idCounter += 1;
  const id = `4444444${idCounter}-4444-4444-8444-444444444444`.slice(0, 36);
  const raw: AlertEventPersistenceProps = {
    id,
    workflowId: WORKFLOW_ID,
    triggeredAt: new Date(triggeredAt),
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
  };
  const result = AlertEvent.fromPersistence(raw);
  if (result.isFailure()) {
    throw new Error('fixture inválido: ' + result.error.reason);
  }
  return result.value;
}

describe('ListEventHistoryHandler', () => {
  it('devuelve la página mapeada a DTOs preservando el orden del repositorio', async () => {
    // El repo devuelve ya ordenado DESC por triggeredAt; el handler respeta ese orden.
    const newer = anEvent('2026-06-05T08:00:00Z');
    const older = anEvent('2026-06-01T08:00:00Z');
    const repository = fakeAlertEventRepository({
      history: async () => [newer, older],
      count: async () => 2,
    });
    const handler = new ListEventHistoryHandler(repository, noopLogger);

    const result = await handler.execute({});

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.items.map((e) => e.id)).toEqual([newer.id, older.id]);
      expect(result.value.total).toBe(2);
      expect(result.value.page).toBe(1);
      expect(result.value.limit).toBe(20);
      expect(result.value.totalPages).toBe(1);
    }
  });

  it('traduce page/limit a offset y los pasa al repositorio junto con los filtros', async () => {
    let capturedQuery: EventHistoryQuery | undefined;
    const repository = fakeAlertEventRepository({
      history: async (query) => {
        capturedQuery = query;
        return [];
      },
      count: async () => 25,
    });
    const handler = new ListEventHistoryHandler(repository, noopLogger);

    const result = await handler.execute({
      workflowId: WORKFLOW_ID,
      status: 'abierto',
      page: 3,
      limit: 10,
    });

    expect(result.isSuccess()).toBe(true);
    expect(capturedQuery).toEqual({
      workflowId: WORKFLOW_ID,
      status: 'abierto',
      offset: 20, // (page 3 - 1) * limit 10
      limit: 10,
    });
    if (result.isSuccess()) {
      expect(result.value.total).toBe(25);
      expect(result.value.totalPages).toBe(3); // ceil(25 / 10)
    }
  });

  it('topea el limit en 100 y usa defaults cuando no se especifican', async () => {
    let capturedQuery: EventHistoryQuery | undefined;
    const repository = fakeAlertEventRepository({
      history: async (query) => {
        capturedQuery = query;
        return [];
      },
      count: async () => 0,
    });
    const handler = new ListEventHistoryHandler(repository, noopLogger);

    await handler.execute({ limit: 999 });

    expect(capturedQuery?.limit).toBe(100);
    expect(capturedQuery?.offset).toBe(0); // page default 1
  });

  it('devuelve totalPages 0 cuando no hay eventos', async () => {
    const repository = fakeAlertEventRepository();
    const handler = new ListEventHistoryHandler(repository, noopLogger);

    const result = await handler.execute({});

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.items).toEqual([]);
      expect(result.value.total).toBe(0);
      expect(result.value.totalPages).toBe(0);
    }
  });
});
