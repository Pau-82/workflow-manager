import { Result, type LayeredError } from '@org/shared';
import { WorkflowId } from '../value-objects/workflow-id.vo.js';
import { WorkflowActivation } from '../value-objects/workflow-activation.vo.js';
import { WorkflowName } from '../value-objects/workflow-name.vo.js';
import { TriggerCondition } from '../value-objects/trigger-condition.vo.js';
import {
  MessageTemplate,
  type RenderValues,
} from '../value-objects/message-template.vo.js';
import { Recipient } from '../value-objects/recipient.vo.js';
import { WorkflowError } from '../errors/workflow.error.js';
import type {
  CreateWorkflowProps,
  WorkflowPersistenceProps,
} from './interface/workflow.props.js';

/**
 * Agregado raíz `Workflow`. Modelo rico + Ley de Demeter: el exterior habla con
 * la raíz, nunca navega los VOs internos. Construcción vía Result (no tira).
 * Internamente todo es VO; los getters exponen primitivos hacia la frontera.
 */
export class Workflow {
  private constructor(
    private readonly _id: WorkflowId,
    private readonly _name: WorkflowName,
    private _isActive: WorkflowActivation,
    private readonly _triggerCondition: TriggerCondition,
    private readonly _messageTemplate: MessageTemplate,
    private readonly _recipients: readonly Recipient[],
  ) {}

  //#region construction
  /** Crea un workflow nuevo. Nace SIEMPRE inactivo, con id generado. */
  static create(props: CreateWorkflowProps): Result<Workflow, LayeredError> {
    return Workflow.build(WorkflowId.generate().value, false, props);
  }

  /** Reconstituye desde persistencia (valida vía los VOs, incluido el id). */
  static fromPersistence(
    raw: WorkflowPersistenceProps,
  ): Result<Workflow, LayeredError> {
    return Workflow.build(raw.id, raw.isActive, raw);
  }

  private static build(
    idValue: string,
    isActive: boolean,
    props: CreateWorkflowProps,
  ): Result<Workflow, LayeredError> {
    const idResult = WorkflowId.create(idValue);
    const nameResult = WorkflowName.create(props.name);
    const conditionResult = TriggerCondition.create(props.triggerCondition);
    const templateResult = MessageTemplate.create(props.messageTemplate);
    const recipientResults = (props.recipients ?? []).map((recipient) =>
      Recipient.create(recipient),
    );

    // Result.combine acumula TODOS los errores de los VOs (no corta en el primero).
    const combined = Result.combine([
      idResult,
      nameResult,
      conditionResult,
      templateResult,
      ...recipientResults,
    ]);

    const errors: LayeredError[] = [...combined.errors];
    if (!props.recipients || props.recipients.length === 0) {
      errors.push(WorkflowError.noRecipients());
    }

    if (errors.length > 0) {
      return Result.fail<Workflow>(
        errors.length === 1 ? errors[0] : WorkflowError.invalidComposition(errors),
      );
    }

    const activation = isActive
      ? WorkflowActivation.active()
      : WorkflowActivation.inactive();

    return Result.ok(
      new Workflow(
        idResult.value,
        nameResult.value,
        activation,
        conditionResult.value,
        templateResult.value,
        recipientResults.map((recipient) => recipient.value),
      ),
    );
  }
  //#endregion

  //#region behavior
  /** Chequea activo + delega en la condición. Inactivo nunca dispara. */
  shouldTrigger(observedValue: number): boolean {
    if (this._isActive.isFalse()) {
      return false;
    }
    return this._triggerCondition.evaluate(observedValue);
  }

  /** Delega el render en la plantilla. */
  renderMessage(values: RenderValues): string {
    return this._messageTemplate.render(values);
  }

  activate(): void {
    this._isActive = WorkflowActivation.active();
  }

  deactivate(): void {
    this._isActive = WorkflowActivation.inactive();
  }
  //#endregion

  //#region accessors (exponen primitivos hacia la frontera)
  get id(): string {
    return this._id.value;
  }
  get name(): string {
    return this._name.name;
  }
  get isActive(): boolean {
    return this._isActive.value;
  }
  get triggerCondition(): TriggerCondition {
    return this._triggerCondition;
  }
  get messageTemplate(): MessageTemplate {
    return this._messageTemplate;
  }
  get recipients(): readonly Recipient[] {
    return this._recipients;
  }
  //#endregion
}
