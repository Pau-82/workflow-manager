import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger } from '@org/shared';
import type { Workflow } from '../../domain/aggregate/workflow.aggregate.js';
import {
  WORKFLOW_REPOSITORY,
  type IWorkflowRepository,
} from '../../domain/ports/workflow.repository.port.js';
import { WorkflowMapper } from '../mappers/workflow.mapper.js';
import { UpdateWorkflowError } from './errors/update-workflow.error.js';
import { CONTEXT } from './constants/update-workflow.constants.js';
import type { UpdateWorkflowInput } from './interface/update-workflow.input.dto.js';
import type { UpdateWorkflowOutput } from './interface/update-workflow.output.dto.js';

@Injectable()
export class UpdateWorkflowHandler {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly repository: IWorkflowRepository,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(
    input: UpdateWorkflowInput,
  ): Promise<Result<UpdateWorkflowOutput, UpdateWorkflowError>> {

    const result = await this.fetchWorkflow(input.id);
    if (result.isFailure()) {
      return Result.fail<UpdateWorkflowOutput, UpdateWorkflowError>(result.error);
    }

    const workflow = result.value;
    const reconfiguration = this.reconfigureWorkflow(workflow, input);
    if (reconfiguration.isFailure()) {
      return Result.fail<UpdateWorkflowOutput, UpdateWorkflowError>(
        reconfiguration.error,
      );
    }

    const persistence = await this.persistWorkflow(workflow);
    if (persistence.isFailure()) {
      return Result.fail<UpdateWorkflowOutput, UpdateWorkflowError>(
        persistence.error,
      );
    }

    return Result.ok<UpdateWorkflowOutput, UpdateWorkflowError>(
      this.presentWorkflow(workflow),
    );
  }

  
  private async fetchWorkflow(
    id: string,
  ): Promise<Result<Workflow, UpdateWorkflowError>> {
    this.logger.log('Updating workflow', CONTEXT, { id });

    const result = await this.repository.getById(id);
    if (result.isFailure()) {
      const error = UpdateWorkflowError.notFound(
        result.error.reason,
        result.error.metadata,
      );

      return Result.fail<Workflow, UpdateWorkflowError>(error);
    }

    return Result.ok<Workflow, UpdateWorkflowError>(result.value);
  }

  private reconfigureWorkflow(
    workflow: Workflow,
    input: UpdateWorkflowInput,
  ): Result<void, UpdateWorkflowError> {
    const result = workflow.update(input);

    if (result.isFailure()) {
      const error = UpdateWorkflowError.invalidInput(
        result.error.reason,
        result.error.metadata,
      );

      return Result.fail<void, UpdateWorkflowError>(error);
    }

    return Result.ok<void, UpdateWorkflowError>(undefined);
  }

  private async persistWorkflow(
    workflow: Workflow,
  ): Promise<Result<void, UpdateWorkflowError>> {
    const result = await Result.executeAsync(() =>
      this.repository.update(workflow),
    );

    if (result.isFailure()) {
      const error = UpdateWorkflowError.persistenceFailed(result.error.reason);

      return Result.fail<void, UpdateWorkflowError>(error);
    }

    return Result.ok<void, UpdateWorkflowError>(undefined);
  }

  private presentWorkflow(workflow: Workflow): UpdateWorkflowOutput {
    const output = WorkflowMapper.toDto(workflow);

    this.logger.log('Workflow updated', CONTEXT, { workflow: output });

    return output;
  }
}
