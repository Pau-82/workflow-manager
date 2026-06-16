import { type Logger } from '@org/shared';
import { ListWorkflowsHandler } from '../list-workflows.handler.js';
import { Workflow } from '../../../domain/aggregate/workflow.aggregate.js';
import { fakeWorkflowRepository } from '../../../test-support/fake-workflow-repository.js';

const noopLogger: Logger = {
  log: () => undefined,
  warn: () => undefined,
  debug: () => undefined,
  error: () => undefined,
  logLayeredError: () => undefined,
  logUnknownError: () => undefined,
};

function aWorkflow(name: string): Workflow {
  const result = Workflow.create({
    name,
    triggerCondition: { type: 'threshold', metricName: 'cpu', operator: '>', value: 90 },
    messageTemplate: 'ok',
    recipients: [{ channel: 'in-app', target: 'soporte' }],
  });
  if (result.isFailure()) {
    throw new Error('fixture inválido');
  }
  return result.value;
}

describe('ListWorkflowsHandler', () => {
  it('devuelve la lista de workflows como DTOs', async () => {
    const repository = fakeWorkflowRepository({
      list: async () => [aWorkflow('Alerta A'), aWorkflow('Alerta B')],
    });
    const handler = new ListWorkflowsHandler(repository, noopLogger);

    const result = await handler.execute();

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.items).toHaveLength(2);
      expect(result.value.items.map((w) => w.name)).toEqual([
        'Alerta A',
        'Alerta B',
      ]);
    }
  });

  it('devuelve una lista vacía cuando no hay workflows', async () => {
    // El default del fake ya devuelve list → [].
    const repository = fakeWorkflowRepository();
    const handler = new ListWorkflowsHandler(repository, noopLogger);

    const result = await handler.execute();

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.items).toEqual([]);
    }
  });
});
