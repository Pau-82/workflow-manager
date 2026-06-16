import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger } from '@org/shared';
import { Workflow } from '../../domain/aggregate/workflow.aggregate.js';
import {
  WORKFLOW_REPOSITORY,
  type IWorkflowRepository,
} from '../../domain/ports/workflow.repository.port.js';
import { WorkflowMapper } from '../mappers/workflow.mapper.js';
import { CreateWorkflowError } from './errors/create-workflow.error.js';
import { CONTEXT } from './constants/create-workflow.constants.js';
import type { CreateWorkflowInput } from './interface/create-workflow.input.dto.js';
import type { CreateWorkflowOutput } from './interface/create-workflow.output.dto.js';

@Injectable()
export class CreateWorkflowHandler {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly repository: IWorkflowRepository,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(
    input: CreateWorkflowInput,
  ): Promise<Result<CreateWorkflowOutput, CreateWorkflowError>> {
    
    const definition = this.createWorkflow(input);
    if (definition.isFailure()) {
      return Result.fail<CreateWorkflowOutput, CreateWorkflowError>(
        definition.error,
      );
    }

    const registration = await this.registerWorkflow(definition.value);
    if (registration.isFailure()) {
      return Result.fail<CreateWorkflowOutput, CreateWorkflowError>(
        registration.error,
      );
    }

    return Result.ok<CreateWorkflowOutput, CreateWorkflowError>(
      this.presentCreatedWorkflow(definition.value),
    );
  }

  //#region pasos del caso de uso

  /** Paso 1 — define el workflow a partir del input (valida invariantes vía VOs). */
  private createWorkflow(
    input: CreateWorkflowInput,
  ): Result<Workflow, CreateWorkflowError> {
    this.logger.log('Creating workflow', CONTEXT, { name: input.name });

    const result = Workflow.create(input);

    if (result.isFailure()) {
      const error = CreateWorkflowError.invalidInput(
        result.error.reason,
        result.error.metadata,
      );

      return Result.fail<Workflow, CreateWorkflowError>(error);
    }

    return Result.ok<Workflow, CreateWorkflowError>(result.value);
  }

  /** Paso 2 — da de alta el workflow en el repositorio. */
  private async registerWorkflow(
    workflow: Workflow,
  ): Promise<Result<void, CreateWorkflowError>> {
    const result = await Result.executeAsync(() =>
      this.repository.save(workflow),
    );

    if (result.isFailure()) {
      const error = CreateWorkflowError.persistenceFailed(result.error.reason);

      return Result.fail<void, CreateWorkflowError>(error);
    }

    return Result.ok<void, CreateWorkflowError>(undefined);
  }

  /** Paso 3 — presenta el workflow creado como DTO de primitivos. */
  private presentCreatedWorkflow(workflow: Workflow): CreateWorkflowOutput {
    const output = WorkflowMapper.toDto(workflow);

    this.logger.log('Workflow created', CONTEXT, { id: output.id });

    return output;
  }

  //#endregion
}
