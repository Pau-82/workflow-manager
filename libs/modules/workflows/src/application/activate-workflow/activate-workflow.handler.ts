import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger } from '@org/shared';
import type { Workflow } from '../../domain/aggregate/workflow.aggregate.js';
import {
  WORKFLOW_REPOSITORY,
  type IWorkflowRepository,
} from '../../domain/ports/workflow.repository.port.js';
import { WorkflowMapper } from '../mappers/workflow.mapper.js';
import { ActivateWorkflowError } from './errors/activate-workflow.error.js';
import { CONTEXT } from './constants/activate-workflow.constants.js';
import type { ActivateWorkflowInput } from './interface/activate-workflow.input.dto.js';
import type { ActivateWorkflowOutput } from './interface/activate-workflow.output.dto.js';

@Injectable()
export class ActivateWorkflowHandler {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly repository: IWorkflowRepository,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(
    input: ActivateWorkflowInput,
  ): Promise<Result<ActivateWorkflowOutput, ActivateWorkflowError>> {

    const result = await this.fetchWorkflow(input.id);
    if (result.isFailure()) {
      return Result.fail<ActivateWorkflowOutput, ActivateWorkflowError>(
        result.error,
      );
    }

    const workflow = result.value;
    workflow.activate();

    const persistence = await this.persistActivation(workflow);
    if (persistence.isFailure()) {
      return Result.fail<ActivateWorkflowOutput, ActivateWorkflowError>(
        persistence.error,
      );
    }

    return Result.ok<ActivateWorkflowOutput, ActivateWorkflowError>(
      this.presentWorkflow(workflow),
    );
  }


  private async fetchWorkflow(
    id: string,
  ): Promise<Result<Workflow, ActivateWorkflowError>> {
    this.logger.log('Activating workflow', CONTEXT, { id });

    const result = await this.repository.getById(id);
    if (result.isFailure()) {
      const error = ActivateWorkflowError.notFound(
        result.error.reason,
        result.error.metadata,
      );

      return Result.fail<Workflow, ActivateWorkflowError>(error);
    }

    return Result.ok<Workflow, ActivateWorkflowError>(result.value);
  }

  private async persistActivation(
    workflow: Workflow,
  ): Promise<Result<void, ActivateWorkflowError>> {
    const result = await Result.executeAsync(() =>
      this.repository.updateActivation(workflow),
    );

    if (result.isFailure()) {
      const error = ActivateWorkflowError.persistenceFailed(result.error.reason);

      return Result.fail<void, ActivateWorkflowError>(error);
    }

    return Result.ok<void, ActivateWorkflowError>(undefined);
  }

  private presentWorkflow(workflow: Workflow): ActivateWorkflowOutput {
    const output = WorkflowMapper.toDto(workflow);

    this.logger.log('Workflow activated', CONTEXT, { workflow: output });

    return output;
  }
}
