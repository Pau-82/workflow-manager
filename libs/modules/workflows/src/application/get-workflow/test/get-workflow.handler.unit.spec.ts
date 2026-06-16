import { Result, type Logger } from '@org/shared';
import { GetWorkflowHandler } from '../get-workflow.handler.js';
import { GET_WORKFLOW_ERRORS } from '../errors/get-workflow.error.js';
import { Workflow } from '../../../domain/aggregate/workflow.aggregate.js';
import { WorkflowNotFoundError } from '../../../domain/errors/workflow-not-found.error.js';
import type { IWorkflowRepository } from '../../../domain/ports/workflow.repository.port.js';

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

function repositoryReturning(
  overrides: Partial<IWorkflowRepository>,
): IWorkflowRepository {
  return {
    save: async () => undefined,
    getById: async (id) => Result.fail<Workflow>(WorkflowNotFoundError.withId(id)),
    findById: async () => null,
    ...overrides,
  };
}

describe('GetWorkflowHandler', () => {
  it('devuelve el workflow como DTO cuando existe', async () => {
    const workflow = aWorkflow();
    const repository = repositoryReturning({
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
    const repository = repositoryReturning({
      getById: async (id) => Result.fail<Workflow>(WorkflowNotFoundError.withId(id)),
    });
    const handler = new GetWorkflowHandler(repository, noopLogger);

    const result = await handler.execute({ id: 'inexistente' });

    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(GET_WORKFLOW_ERRORS.NOT_FOUND);
    }
  });
});
