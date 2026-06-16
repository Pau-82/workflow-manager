import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger } from '@org/shared';
import type { Workflow } from '../../domain/aggregate/workflow.aggregate.js';
import {
  WORKFLOW_REPOSITORY,
  type IWorkflowRepository,
} from '../../domain/ports/workflow.repository.port.js';
import { WorkflowMapper } from '../mappers/workflow.mapper.js';
import { ListWorkflowsError } from './errors/list-workflows.error.js';
import { CONTEXT } from './constants/list-workflows.constants.js';
import type { ListWorkflowsOutput } from './interface/list-workflows.output.dto.js';

@Injectable()
export class ListWorkflowsHandler {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly repository: IWorkflowRepository,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(): Promise<Result<ListWorkflowsOutput, ListWorkflowsError>> {

    const listing = await this.fetchWorkflows();
    if (listing.isFailure()) {
      return Result.fail<ListWorkflowsOutput, ListWorkflowsError>(listing.error);
    }

    return Result.ok<ListWorkflowsOutput, ListWorkflowsError>(
      this.presentWorkflows(listing.value),
    );
  }

  
  private async fetchWorkflows(): Promise<
    Result<Workflow[], ListWorkflowsError>
  > {
    this.logger.log('Listing workflows', CONTEXT);

    const result = await Result.executeAsync(() => this.repository.list());
    if (result.isFailure()) {
      const error = ListWorkflowsError.persistenceFailed(result.error.reason);

      return Result.fail<Workflow[], ListWorkflowsError>(error);
    }

    return Result.ok<Workflow[], ListWorkflowsError>(result.value);
  }

  
  private presentWorkflows(workflows: Workflow[]): ListWorkflowsOutput {
    const items = workflows.map((workflow) => WorkflowMapper.toDto(workflow));

    this.logger.log('Workflows listed', CONTEXT, { count: items.length });
    
    return { items };
  }
}
