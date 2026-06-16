import { Result, type Logger } from '@org/shared';
import { ActivateWorkflowHandler } from '../activate-workflow.handler.js';
import { ACTIVATE_WORKFLOW_ERRORS } from '../errors/activate-workflow.error.js';
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

function anInactiveWorkflow(): Workflow {
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

describe('ActivateWorkflowHandler', () => {
  it('activa el workflow y devuelve el DTO con isActive en true', async () => {
    const workflow = anInactiveWorkflow();
    expect(workflow.isActive).toBe(false);

    const repository = fakeWorkflowRepository({
      getById: async () => Result.ok(workflow),
    });
    const handler = new ActivateWorkflowHandler(repository, noopLogger);

    const result = await handler.execute({ id: workflow.id });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.id).toBe(workflow.id);
      expect(result.value.isActive).toBe(true);
    }
  });

  it('devuelve NOT_FOUND cuando el workflow no existe', async () => {
    // El default del fake ya devuelve getById → NotFound.
    const repository = fakeWorkflowRepository();
    const handler = new ActivateWorkflowHandler(repository, noopLogger);

    const result = await handler.execute({ id: 'inexistente' });

    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(ACTIVATE_WORKFLOW_ERRORS.NOT_FOUND);
    }
  });
});
