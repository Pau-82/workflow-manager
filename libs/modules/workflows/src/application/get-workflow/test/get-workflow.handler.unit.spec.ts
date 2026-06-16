import { Result, type Logger } from '@org/shared';
import { GetWorkflowHandler } from '../get-workflow.handler.js';
import { GET_WORKFLOW_ERRORS } from '../errors/get-workflow.error.js';
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

function aWorkflow(): Workflow {
  const result = Workflow.create({
    name: 'Alerta CPU',
    triggerCondition: { type: 'threshold', metricName: 'cpu', operator: '>', value: 90 },
    messageTemplate: 'ok',
    recipients: [{ channel: 'in-app', target: 'soporte' }],
  });
  if (result.isFailure()) {
    throw new Error('fixture inválido');
  }
  return result.value;
}

describe('GetWorkflowHandler', () => {
  it('devuelve el workflow como DTO cuando existe', async () => {
    const workflow = aWorkflow();
    const repository = fakeWorkflowRepository({
      getById: async () => Result.ok(workflow),
    });
    const handler = new GetWorkflowHandler(repository, noopLogger);

    const result = await handler.execute({ id: workflow.id });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.id).toBe(workflow.id);
      expect(result.value.name).toBe('Alerta CPU');
      expect(result.value.triggerCondition.type).toBe('threshold');
    }
  });

  it('devuelve un error NOT_FOUND cuando no existe', async () => {
    // El default del fake ya devuelve getById → NotFound.
    const repository = fakeWorkflowRepository();
    const handler = new GetWorkflowHandler(repository, noopLogger);

    const result = await handler.execute({ id: 'inexistente' });

    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(GET_WORKFLOW_ERRORS.NOT_FOUND);
    }
  });
});
