import { Result, StringValueObject, type LayeredError } from '@org/shared';
import { WorkflowNameError } from '../errors/workflow-name.error.js';

const MAX_LENGTH = 100;

/** Nombre del workflow: string no vacío (trim), máx 100. */
export class WorkflowName extends StringValueObject {
  //#region construction
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<WorkflowName, LayeredError> {
    const sanitized = WorkflowName.sanitize(raw);
    const error = WorkflowName.validate(sanitized);
    if (error) {
      return Result.fail<WorkflowName>(error);
    }
    return Result.ok(new WorkflowName(sanitized));
  }

  private static sanitize(raw: string): string {
    return (raw ?? '').trim();
  }

  private static validate(value: string): LayeredError | null {
    if (value.length === 0) {
      return WorkflowNameError.empty();
    }
    if (value.length > MAX_LENGTH) {
      return WorkflowNameError.tooLong(MAX_LENGTH);
    }
    return null;
  }
  //#endregion

  //#region accessors
  get name(): string {
    return this.value;
  }
  //#endregion
}
