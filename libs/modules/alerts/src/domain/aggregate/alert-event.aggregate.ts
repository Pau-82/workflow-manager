import { Result, type LayeredError } from '@org/shared';
import { AlertEventId } from '../value-objects/alert-event-id.vo.js';
import { WorkflowReference } from '../value-objects/workflow-reference.vo.js';
import {
  TriggerContext,
  type TriggerContextInput,
} from '../value-objects/trigger-context/trigger-context.vo.js';
import {
  Resolution,
  type AlertEventStatus,
} from '../value-objects/resolution/resolution.vo.js';
import { AlertEventError } from '../errors/alert-event.error.js';
import type {
  CreateAlertEventProps,
  AlertEventPersistenceProps,
} from './interface/alert-event.props.js';

/** Snapshot crudo común que arma/valida los VOs internos del evento. */
interface AlertEventSnapshot {
  triggerContext: TriggerContextInput;
  renderedMessage: string;
}

/**
 * Agregado raíz `AlertEvent`: el hecho histórico de que un workflow disparó. Es un
 * snapshot auto-contenido (referencia al workflow SOLO por id, no lo embebe). El
 * estado de resolución vive en el VO `Resolution` (unión Open|Resolved), que hace
 * la invariante "resuelto ⇒ tiene fecha" estructuralmente imposible de violar.
 * Construcción/reconstitución vía Result (no tira). Los getters exponen primitivos.
 */
export class AlertEvent {
  private constructor(
    private readonly _id: AlertEventId,
    private readonly _workflowId: WorkflowReference,
    private readonly _triggeredAt: Date,
    private readonly _triggerContext: TriggerContext,
    private readonly _renderedMessage: string,
    private _resolution: Resolution,
  ) {}

  //#region construction
  /** Registra un disparo nuevo. Nace SIEMPRE 'abierto', con id generado. */
  static create(props: CreateAlertEventProps): Result<AlertEvent, LayeredError> {
    return AlertEvent.build(
      AlertEventId.generate().value,
      props.workflowId,
      props.triggeredAt ?? new Date(),
      { status: 'abierto', resolvedAt: null, note: null },
      props,
    );
  }

  /** Reconstituye desde persistencia (valida vía los VOs, incluido el id). */
  static fromPersistence(
    raw: AlertEventPersistenceProps,
  ): Result<AlertEvent, LayeredError> {
    return AlertEvent.build(
      raw.id,
      raw.workflowId,
      raw.triggeredAt,
      { status: raw.status, resolvedAt: raw.resolvedAt, note: raw.resolutionNote },
      raw,
    );
  }

  /** Construye y valida TODO; acumula los errores (no corta en el primero). */
  private static build(
    idValue: string,
    workflowIdValue: string,
    triggeredAt: Date,
    resolution: { status: string; resolvedAt: Date | null; note: string | null },
    snapshot: AlertEventSnapshot,
  ): Result<AlertEvent, LayeredError> {
    const idResult = AlertEventId.create(idValue);
    const workflowRefResult = WorkflowReference.create(workflowIdValue);
    const contextResult = TriggerContext.create(snapshot.triggerContext);
    const resolutionResult = Resolution.create(resolution);

    const combined = Result.combine([
      idResult,
      workflowRefResult,
      contextResult,
      resolutionResult,
    ]);
    const errors: LayeredError[] = [...combined.errors];

    const renderedMessage = (snapshot.renderedMessage ?? '').trim();
    if (renderedMessage.length === 0) {
      errors.push(AlertEventError.emptyRenderedMessage());
    }

    if (!AlertEvent.isValidDate(triggeredAt)) {
      errors.push(AlertEventError.invalidTriggeredAt());
    }

    if (errors.length > 0) {
      return Result.fail<AlertEvent>(
        errors.length === 1 ? errors[0] : AlertEventError.invalidComposition(errors),
      );
    }

    return Result.ok(
      new AlertEvent(
        idResult.value,
        workflowRefResult.value,
        triggeredAt,
        contextResult.value,
        renderedMessage,
        resolutionResult.value,
      ),
    );
  }

  private static isValidDate(value: Date): boolean {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }
  //#endregion

  //#region behavior
  /**
   * Resuelve el evento, con nota opcional. Delega la transición en el VO Resolution
   * (que rechaza resolver uno ya resuelto y valida la nota); el agregado no re-valida.
   */
  resolve(note?: string | null): Result<void, LayeredError> {
    const result = this._resolution.resolve(note);
    if (result.isFailure()) {
      return Result.fail<void>(result.error);
    }
    this._resolution = result.value;
    return Result.ok<void>(undefined);
  }
  //#endregion

  //#region accessors (exponen primitivos hacia la frontera)
  get id(): string {
    return this._id.value;
  }
  get workflowId(): string {
    return this._workflowId.value;
  }
  get triggeredAt(): Date {
    return this._triggeredAt;
  }
  get triggerContext(): TriggerContext {
    return this._triggerContext;
  }
  get renderedMessage(): string {
    return this._renderedMessage;
  }
  get status(): AlertEventStatus {
    return this._resolution.status;
  }
  get resolvedAt(): Date | null {
    return this._resolution.resolvedAt;
  }
  get resolutionNote(): string | null {
    return this._resolution.note;
  }
  //#endregion
}
