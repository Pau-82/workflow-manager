import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger } from '@org/shared';
import type { Workflow } from '../../domain/aggregate/workflow.aggregate.js';
import {
  WORKFLOW_REPOSITORY,
  type IWorkflowRepository,
} from '../../domain/ports/workflow.repository.port.js';
import { WorkflowMapper } from '../mappers/workflow.mapper.js';
import { GetWorkflowError } from './errors/get-workflow.error.js';
import { CONTEXT } from './constants/get-workflow.constants.js';
import type { GetWorkflowInput } from './interface/get-workflow.input.dto.js';
import type { GetWorkflowOutput } from './interface/get-workflow.output.dto.js';

@Injectable()
export class GetWorkflowHandler {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly repository: IWorkflowRepository,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(
    input: GetWorkflowInput,
  ): Promise<Result<GetWorkflowOutput, GetWorkflowError>> {
    const workflow = await this.fetchWorkflow(input.id);

    if (workflow.isFailure()) {
      return Result.fail<GetWorkflowOutput, GetWorkflowError>(workflow.error);
    }

    return Result.ok<GetWorkflowOutput, GetWorkflowError>(
      this.presentWorkflow(workflow.value),
    );
  }

  
  private async fetchWorkflow(
    id: string,
  ): Promise<Result<Workflow, GetWorkflowError>> {
    this.logger.log('Fetching workflow', CONTEXT, { id });

    const result = await this.repository.getById(id);
    if (result.isFailure()) {
      const error = GetWorkflowError.notFound(
        result.error.reason,
        result.error.metadata,
      );

      return Result.fail<Workflow, GetWorkflowError>(error);
    }

    return Result.ok<Workflow, GetWorkflowError>(result.value);
  }

 
  private presentWorkflow(workflow: Workflow): GetWorkflowOutput {
    const output = WorkflowMapper.toDto(workflow);
    this.logger.log('Workflow found', CONTEXT, { workflow: output });
    return output;
  }
}
