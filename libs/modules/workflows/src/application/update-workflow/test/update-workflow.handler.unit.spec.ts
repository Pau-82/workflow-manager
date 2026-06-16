import { Result, type Logger } from '@org/shared';
import { UpdateWorkflowHandler } from '../update-workflow.handler.js';
import { UPDATE_WORKFLOW_ERRORS } from '../errors/update-workflow.error.js';
import { Workflow } from '../../../domain/aggregate/workflow.aggregate.js';
import { fakeWorkflowRepository } from '../../../test-support/fake-workflow-repository.js';
import type { UpdateWorkflowInput } from '../interface/update-workflow.input.dto.js';

const noopLogger: Logger = {
  log: () => undefined,
  warn: () => undefined,
  debug: () => undefined,
  error: () => undefined,
  logLayeredError: () => undefined,
  logUnknownError: () => undefined,
};

function aWorkflow(name = 'Original'): Workflow {
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

function validInput(
  overrides: Partial<UpdateWorkflowInput> = {},
): UpdateWorkflowInput {
  return {
    id: 'wf-id',
    name: 'Renombrado',
    triggerCondition: { type: 'threshold', metricName: 'cpu', operator: '>', value: 95 },
    messageTemplate: 'actualizado',
    recipients: [{ channel: 'in-app', target: 'soporte' }],
    ...overrides,
  };
}

describe('UpdateWorkflowHandler', () => {
  it('actualiza el workflow y devuelve el DTO con los cambios', async () => {
    const workflow = aWorkflow('Original');
    const repository = fakeWorkflowRepository({
      getById: async () => Result.ok(workflow),
    });
    const handler = new UpdateWorkflowHandler(repository, noopLogger);

    const result = await handler.execute(
      validInput({ id: workflow.id, name: 'Renombrado' }),
    );

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.name).toBe('Renombrado');
      expect(result.value.messageTemplate).toBe('actualizado');
    }
  });

  it('devuelve NOT_FOUND cuando el workflow no existe', async () => {
    // El default del fake ya devuelve getById → NotFound.
    const repository = fakeWorkflowRepository();
    const handler = new UpdateWorkflowHandler(repository, noopLogger);

    const result = await handler.execute(validInput());

    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(UPDATE_WORKFLOW_ERRORS.NOT_FOUND);
    }
  });

  it('devuelve INVALID_INPUT cuando la nueva configuración es inválida', async () => {
    const workflow = aWorkflow();
    const repository = fakeWorkflowRepository({
      getById: async () => Result.ok(workflow),
    });
    const handler = new UpdateWorkflowHandler(repository, noopLogger);

    const result = await handler.execute(validInput({ name: '' }));

    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(UPDATE_WORKFLOW_ERRORS.INVALID_INPUT);
    }
  });
});
