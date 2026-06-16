import { BooleanValueObject } from '@org/shared';

/**
 * Estado de activación de un workflow. Sin invariantes (cualquier booleano es
 * válido); modela el flag como VO por consistencia con el resto del dominio.
 * Las transiciones las controla el agregado (activate/deactivate).
 */
export class WorkflowActivation extends BooleanValueObject {
  private constructor(value: boolean) {
    super(value);
  }

  static active(): WorkflowActivation {
    return new WorkflowActivation(true);
  }

  static inactive(): WorkflowActivation {
    return new WorkflowActivation(false);
  }
}
