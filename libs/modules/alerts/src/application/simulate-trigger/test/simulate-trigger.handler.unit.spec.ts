import { Result, type Logger, type IUnitOfWork } from '@org/shared';
import {
  Workflow,
  type IWorkflowRepository,
  type CreateWorkflowProps,
} from '@org/workflows';
import type { INotificationCreator } from '@org/notifications';
import { SimulateTriggerHandler } from '../simulate-trigger.handler.js';
import { AlertEvent } from '../../../domain/aggregate/alert-event.aggregate.js';
import { DuplicateOpenEventError } from '../../../domain/errors/duplicate-open-event.error.js';
import type { IEmailSender } from '../../../domain/ports/email-sender.port.js';
import { fakeAlertEventRepository } from '../../../test-support/fake-alert-event-repository.js';

const noopLogger: Logger = {
  log: () => undefined,
  warn: () => undefined,
  debug: () => undefined,
  error: () => undefined,
  logLayeredError: () => undefined,
  logUnknownError: () => undefined,
};

// UoW de test: ejecuta el callback con un tx ficticio y devuelve su Result.
const passthroughUoW: IUnitOfWork = {
  execute: (work) => work({}),
};

function aWorkflow(overrides: Partial<CreateWorkflowProps> = {}): Workflow {
  const result = Workflow.create({
    name: 'Alerta CPU',
    triggerCondition: { type: 'threshold', metricName: 'cpu', operator: '>', value: 90 },
    messageTemplate: 'CPU al {{valor}}%',
    recipients: [
      { channel: 'in-app', target: 'guardia' },
      { channel: 'email', address: 'ops@empresa.com' },
    ],
    ...overrides,
  });
  if (result.isFailure()) {
    throw new Error('fixture inválido: ' + result.error.reason);
  }
  return result.value;
}

function workflowRepoReturning(workflow: Workflow): IWorkflowRepository {
  return {
    save: async () => undefined,
    update: async () => undefined,
    updateActivation: async () => undefined,
    getById: async () => Result.ok(workflow),
    findById: async () => workflow,
    list: async () => [workflow],
  };
}

describe('SimulateTriggerHandler', () => {
  it('no dispara si el workflow está inactivo: triggered=false y no toca la base', async () => {
    const workflow = aWorkflow(); // nace inactivo
    const save = jest.fn(async () => undefined);
    const handler = new SimulateTriggerHandler(
      workflowRepoReturning(workflow),
      fakeAlertEventRepository({ save }),
      { create: jest.fn(async () => Result.ok<void>(undefined)) },
      { send: jest.fn(async () => Result.ok<void>(undefined)) },
      passthroughUoW,
      noopLogger,
    );

    const result = await handler.execute({ workflowId: workflow.id, observedValue: 99 });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.triggered).toBe(false);
      expect(result.value.duplicate).toBe(false);
    }
    expect(save).not.toHaveBeenCalled();
  });

  it('dispara sin evento abierto: crea evento + notificación in-app y manda email', async () => {
    const workflow = aWorkflow();
    workflow.activate();
    const save = jest.fn(async () => undefined);
    const createNotif: INotificationCreator['create'] = jest.fn(async () =>
      Result.ok<void>(undefined),
    );
    const sendEmail: IEmailSender['send'] = jest.fn(async () =>
      Result.ok<void>(undefined),
    );

    const handler = new SimulateTriggerHandler(
      workflowRepoReturning(workflow),
      fakeAlertEventRepository({ save, findOpenEventByWorkflow: async () => null }),
      { create: createNotif },
      { send: sendEmail },
      passthroughUoW,
      noopLogger,
    );

    const result = await handler.execute({ workflowId: workflow.id, observedValue: 95 });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.triggered).toBe(true);
      expect(result.value.duplicate).toBe(false);
      expect(result.value.eventId).toBeDefined();
      expect(result.value.renderedMessage).toBe('CPU al 95%');
    }
    expect(save).toHaveBeenCalledTimes(1);
    // Una notificación in-app (el recipient 'guardia'), no para el email.
    expect(createNotif).toHaveBeenCalledTimes(1);
    // Un email (el recipient 'ops@empresa.com'), post-commit.
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('dispara pero ya hay un evento abierto: duplicate=true sin crear', async () => {
    const workflow = aWorkflow();
    workflow.activate();
    const existing = AlertEvent.create({
      workflowId: workflow.id,
      triggerContext: {
        type: 'threshold',
        metricName: 'cpu',
        operator: '>',
        threshold: 90,
        observedValue: 92,
      },
      renderedMessage: 'CPU al 92%',
    });
    const event = existing.isSuccess() ? existing.value : null;
    const save = jest.fn(async () => undefined);

    const handler = new SimulateTriggerHandler(
      workflowRepoReturning(workflow),
      fakeAlertEventRepository({ save, findOpenEventByWorkflow: async () => event }),
      { create: jest.fn(async () => Result.ok<void>(undefined)) },
      { send: jest.fn(async () => Result.ok<void>(undefined)) },
      passthroughUoW,
      noopLogger,
    );

    const result = await handler.execute({ workflowId: workflow.id, observedValue: 95 });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.triggered).toBe(true);
      expect(result.value.duplicate).toBe(true);
      expect(result.value.eventId).toBe(event?.id);
    }
    expect(save).not.toHaveBeenCalled();
  });

  it('carrera: si save choca el índice único (P2002), se traduce a duplicate=true', async () => {
    const workflow = aWorkflow();
    workflow.activate();
    const handler = new SimulateTriggerHandler(
      workflowRepoReturning(workflow),
      fakeAlertEventRepository({
        findOpenEventByWorkflow: async () => null,
        save: async () => {
          throw DuplicateOpenEventError.forWorkflow(workflow.id);
        },
      }),
      { create: jest.fn(async () => Result.ok<void>(undefined)) },
      { send: jest.fn(async () => Result.ok<void>(undefined)) },
      passthroughUoW,
      noopLogger,
    );

    const result = await handler.execute({ workflowId: workflow.id, observedValue: 95 });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.triggered).toBe(true);
      expect(result.value.duplicate).toBe(true);
    }
  });
});
