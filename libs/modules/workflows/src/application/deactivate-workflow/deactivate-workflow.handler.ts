import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger } from '@org/shared';
import type { Workflow } from '../../domain/aggregate/workflow.aggregate.js';
import {
  WORKFLOW_REPOSITORY,
  type IWorkflowRepository,
} from '../../domain/ports/workflow.repository.port.js';
import { WorkflowMapper } from '../mappers/workflow.mapper.js';
import { DeactivateWorkflowError } from './errors/deactivate-workflow.error.js';
import { CONTEXT } from './constants/deactivate-workflow.constants.js';
import type { DeactivateWorkflowInput } from './interface/deactivate-workflow.input.dto.js';
import type { DeactivateWorkflowOutput } from './interface/deactivate-workflow.output.dto.js';

@Injectable()
export class DeactivateWorkflowHandler {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly repository: IWorkflowRepository,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(
    input: DeactivateWorkflowInput,
  ): Promise<Result<DeactivateWorkflowOutput, DeactivateWorkflowError>> {

    const result = await this.fetchWorkflow(input.id);
    if (result.isFailure()) {
      return Result.fail<DeactivateWorkflowOutput, DeactivateWorkflowError>(
        result.error,
      );
    }

    const workflow = result.value;
    workflow.deactivate();

    const persistence = await this.persistActivation(workflow);
    if (persistence.isFailure()) {
      return Result.fail<DeactivateWorkflowOutput, DeactivateWorkflowError>(
        persistence.error,
      );
    }

    return Result.ok<DeactivateWorkflowOutput, DeactivateWorkflowError>(
      this.presentWorkflow(workflow),
    );
  }


  private async fetchWorkflow(
    id: string,
  ): Promise<Result<Workflow, DeactivateWorkflowError>> {
    this.logger.log('Deactivating workflow', CONTEXT, { id });

    const result = await this.repository.getById(id);
    if (result.isFailure()) {
      const error = DeactivateWorkflowError.notFound(
        result.error.reason,
        result.error.metadata,
      );

      return Result.fail<Workflow, DeactivateWorkflowError>(error);
    }

    return Result.ok<Workflow, DeactivateWorkflowError>(result.value);
  }

  private async persistActivation(
    workflow: Workflow,
  ): Promise<Result<void, DeactivateWorkflowError>> {
    const result = await Result.executeAsync(() =>
      this.repository.updateActivation(workflow),
    );

    if (result.isFailure()) {
      const error = DeactivateWorkflowError.persistenceFailed(
        result.error.reason,
      );

      return Result.fail<void, DeactivateWorkflowError>(error);
    }

    return Result.ok<void, DeactivateWorkflowError>(undefined);
  }

  private presentWorkflow(workflow: Workflow): DeactivateWorkflowOutput {
    const output = WorkflowMapper.toDto(workflow);

    this.logger.log('Workflow deactivated', CONTEXT, { workflow: output });

    return output;
  }
}
