import type { WorkflowDto } from '../../mappers/interface/workflow.dto.js';

/** Output de ListWorkflows: lista simple de workflows en primitivos. */
export interface ListWorkflowsOutput {
  items: WorkflowDto[];
}
