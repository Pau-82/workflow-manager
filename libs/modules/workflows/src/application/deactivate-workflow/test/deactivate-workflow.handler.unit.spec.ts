import { Result, type Logger } from '@org/shared';
import { DeactivateWorkflowHandler } from '../deactivate-workflow.handler.js';
import { DEACTIVATE_WORKFLOW_ERRORS } from '../errors/deactivate-workflow.error.js';
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

function anActiveWorkflow(): Workflow {
  const result = Workflow.create({
    name: 'Alerta CPU',
    triggerCondition: { type: 'threshold', metricName: 'cpu', operator: '>', value: 90 },
    messageTemplate: 'ok',
    recipients: [{ channel: 'in-app', target: 'soporte' }],
  });
  if (result.isFailure()) {
    throw new Error('fixture inválido');
  }
  const workflow = result.value;
  workflow.activate();
  return workflow;
}

describe('DeactivateWorkflowHandler', () => {
  it('desactiva el workflow y devuelve el DTO con isActive en false', async () => {
    const workflow = anActiveWorkflow();
    expect(workflow.isActive).toBe(true);

    const repository = fakeWorkflowRepository({
      getById: async () => Result.ok(workflow),
    });
    const handler = new DeactivateWorkflowHandler(repository, noopLogger);

    const result = await handler.execute({ id: workflow.id });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.id).toBe(workflow.id);
      expect(result.value.isActive).toBe(false);
    }
  });

  it('devuelve NOT_FOUND cuando el workflow no existe', async () => {
    // El default del fake ya devuelve getById → NotFound.
    const repository = fakeWorkflowRepository();
    const handler = new DeactivateWorkflowHandler(repository, noopLogger);

    const result = await handler.execute({ id: 'inexistente' });

    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(DEACTIVATE_WORKFLOW_ERRORS.NOT_FOUND);
    }
  });
});
