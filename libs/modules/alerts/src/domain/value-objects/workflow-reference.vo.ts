import { Result, Uuid, type LayeredError } from '@org/shared';
import { WorkflowReferenceError } from '../errors/workflow-reference.error.js';

/**
 * Referencia (por ID) al Workflow que originó el evento. El evento NO embebe el
 * Workflow: sólo guarda su id. Branded para no confundirla con la identidad propia
 * del evento. Valida formato UUID; la existencia real es responsabilidad de la FK.
 */
export class WorkflowReference extends Uuid {
  readonly kind = 'WorkflowReference' as const;

  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<WorkflowReference, LayeredError> {
    const sanitized = (raw ?? '').trim();
    if (!Uuid.isValid(sanitized)) {
      return Result.fail<WorkflowReference>(WorkflowReferenceError.invalid(raw));
    }
    return Result.ok(new WorkflowReference(sanitized));
  }
}
