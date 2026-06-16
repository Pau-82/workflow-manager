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

/** Configuración editable del workflow (los VOs que define/edita el usuario). */
interface WorkflowConfig {
  name: WorkflowName;
  triggerCondition: TriggerCondition;
  messageTemplate: MessageTemplate;
  recipients: readonly Recipient[];
}

/**
 * Agregado raíz `Workflow`. Modelo rico + Ley de Demeter: el exterior habla con
 * la raíz, nunca navega los VOs internos. Construcción/edición vía Result (no tira).
 * Internamente todo es VO; los getters exponen primitivos hacia la frontera.
 */
export class Workflow {
  private constructor(
    private readonly _id: WorkflowId,
    private _name: WorkflowName,
    private _isActive: WorkflowActivation,
    private _triggerCondition: TriggerCondition,
    private _messageTemplate: MessageTemplate,
    private _recipients: readonly Recipient[],
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
    if (idResult.isFailure()) {
      return Result.fail<Workflow>(idResult.error);
    }
    const configResult = Workflow.buildConfig(props);
    if (configResult.isFailure()) {
      return Result.fail<Workflow>(configResult.error);
    }
    const config = configResult.value;
    const activation = isActive
      ? WorkflowActivation.active()
      : WorkflowActivation.inactive();

    return Result.ok(
      new Workflow(
        idResult.value,
        config.name,
        activation,
        config.triggerCondition,
        config.messageTemplate,
        config.recipients,
      ),
    );
  }

  /** Construye y valida los VOs de configuración; acumula TODOS los errores. */
  private static buildConfig(
    props: CreateWorkflowProps,
  ): Result<WorkflowConfig, LayeredError> {
    const nameResult = WorkflowName.create(props.name);
    const conditionResult = TriggerCondition.create(props.triggerCondition);
    const templateResult = MessageTemplate.create(props.messageTemplate);
    const recipientResults = (props.recipients ?? []).map((recipient) =>
      Recipient.create(recipient),
    );

    const combined = Result.combine([
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
      return Result.fail<WorkflowConfig>(
        errors.length === 1 ? errors[0] : WorkflowError.invalidComposition(errors),
      );
    }

    return Result.ok<WorkflowConfig>({
      name: nameResult.value,
      triggerCondition: conditionResult.value,
      messageTemplate: templateResult.value,
      recipients: recipientResults.map((recipient) => recipient.value),
    });
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

  /**
   * Reconfiguración TOTAL del workflow (name, triggerCondition, messageTemplate,
   * recipients). Revalida invariantes reconstruyendo los VOs. NO toca id ni
   * isActive (eso es de activate/deactivate). La mutación pasa siempre por acá.
   */
  update(props: CreateWorkflowProps): Result<void, LayeredError> {
    const configResult = Workflow.buildConfig(props);
    if (configResult.isFailure()) {
      return Result.fail<void>(configResult.error);
    }
    const config = configResult.value;
    this._name = config.name;
    this._triggerCondition = config.triggerCondition;
    this._messageTemplate = config.messageTemplate;
    this._recipients = config.recipients;
    return Result.ok<void>(undefined);
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
