import { Result, Uuid, type LayeredError } from '@org/shared';
import { WorkflowIdError } from '../errors/workflow-id.error.js';

/** Identidad del agregado Workflow (UUID). Branded: no es intercambiable con otros ids. */
export class WorkflowId extends Uuid {
  // Marca nominal: distingue WorkflowId de otros ids en tiempo de compilación.
  readonly kind = 'WorkflowId' as const;

  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<WorkflowId, LayeredError> {
    const sanitized = (raw ?? '').trim();
    if (!Uuid.isValid(sanitized)) {
      return Result.fail<WorkflowId>(WorkflowIdError.invalid(raw));
    }
    return Result.ok(new WorkflowId(sanitized));
  }

  static generate(): WorkflowId {
    return new WorkflowId(globalThis.crypto.randomUUID());
  }
}
