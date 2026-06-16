import { Result, type LayeredError } from '@org/shared';
import { AlertEventId } from '../value-objects/alert-event-id.vo.js';
import { WorkflowReference } from '../value-objects/workflow-reference.vo.js';
import {
  TriggerContext,
  type TriggerContextInput,
} from '../value-objects/trigger-context/trigger-context.vo.js';
import { AlertEventError } from '../errors/alert-event.error.js';
import type {
  CreateAlertEventProps,
  AlertEventPersistenceProps,
} from './interface/alert-event.props.js';

const MAX_RESOLUTION_NOTE_LENGTH = 300;

export const ALERT_EVENT_STATUSES = ['abierto', 'resuelto'] as const;
export type AlertEventStatus = (typeof ALERT_EVENT_STATUSES)[number];

/** Snapshot crudo común que arma/valida los VOs internos del evento. */
interface AlertEventSnapshot {
  triggerContext: TriggerContextInput;
  renderedMessage: string;
}

/**
 * Agregado raíz `AlertEvent`: el hecho histórico de que un workflow disparó. Es un
 * snapshot auto-contenido (referencia al workflow SOLO por id, no lo embebe) e
 * inmutable salvo por la transición de resolución (la agrega el Vertical 8).
 * Construcción/reconstitución vía Result (no tira). Internamente VOs; los getters
 * exponen primitivos hacia la frontera.
 */
export class AlertEvent {
  private constructor(
    private readonly _id: AlertEventId,
    private readonly _workflowId: WorkflowReference,
    private readonly _triggeredAt: Date,
    private readonly _triggerContext: TriggerContext,
    private readonly _renderedMessage: string,
    private _status: AlertEventStatus,
    private _resolvedAt: Date | null,
    private _resolutionNote: string | null,
  ) {}

  //#region construction
  /** Registra un disparo nuevo. Nace SIEMPRE 'abierto', con id generado. */
  static create(props: CreateAlertEventProps): Result<AlertEvent, LayeredError> {
    return AlertEvent.build(
      AlertEventId.generate().value,
      props.workflowId,
      props.triggeredAt ?? new Date(),
      'abierto',
      null,
      null,
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
      raw.status,
      raw.resolvedAt,
      raw.resolutionNote,
      raw,
    );
  }

  /** Construye y valida TODO; acumula los errores (no corta en el primero). */
  private static build(
    idValue: string,
    workflowIdValue: string,
    triggeredAt: Date,
    status: string,
    resolvedAt: Date | null,
    resolutionNote: string | null,
    snapshot: AlertEventSnapshot,
  ): Result<AlertEvent, LayeredError> {
    const idResult = AlertEventId.create(idValue);
    const workflowRefResult = WorkflowReference.create(workflowIdValue);
    const contextResult = TriggerContext.create(snapshot.triggerContext);

    const combined = Result.combine([idResult, workflowRefResult, contextResult]);
    const errors: LayeredError[] = [...combined.errors];

    const renderedMessage = (snapshot.renderedMessage ?? '').trim();
    if (renderedMessage.length === 0) {
      errors.push(AlertEventError.emptyRenderedMessage());
    }

    if (!AlertEvent.isValidDate(triggeredAt)) {
      errors.push(AlertEventError.invalidTriggeredAt());
    }

    const normalizedNote = AlertEvent.normalizeNote(resolutionNote);
    if (normalizedNote && normalizedNote.length > MAX_RESOLUTION_NOTE_LENGTH) {
      errors.push(AlertEventError.resolutionNoteTooLong(MAX_RESOLUTION_NOTE_LENGTH));
    }

    if (!AlertEvent.isValidStatus(status)) {
      errors.push(
        AlertEventError.invalidStatus(status, ALERT_EVENT_STATUSES),
      );
    } else {
      const consistency = AlertEvent.checkResolutionConsistency(
        status,
        resolvedAt,
        normalizedNote,
      );
      if (consistency) {
        errors.push(consistency);
      }
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
        status as AlertEventStatus,
        resolvedAt,
        normalizedNote,
      ),
    );
  }

  private static checkResolutionConsistency(
    status: AlertEventStatus,
    resolvedAt: Date | null,
    resolutionNote: string | null,
  ): LayeredError | null {
    if (status === 'resuelto' && !resolvedAt) {
      return AlertEventError.inconsistentResolution(
        'A resolved event must have a resolvedAt date.',
      );
    }
    if (status === 'abierto' && (resolvedAt || resolutionNote)) {
      return AlertEventError.inconsistentResolution(
        'An open event cannot have resolvedAt or resolutionNote.',
      );
    }
    return null;
  }

  private static isValidStatus(value: string): value is AlertEventStatus {
    return (ALERT_EVENT_STATUSES as readonly string[]).includes(value);
  }

  private static isValidDate(value: Date): boolean {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }

  private static normalizeNote(note: string | null): string | null {
    const trimmed = (note ?? '').trim();
    return trimmed.length === 0 ? null : trimmed;
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
    return this._status;
  }
  get resolvedAt(): Date | null {
    return this._resolvedAt;
  }
  get resolutionNote(): string | null {
    return this._resolutionNote;
  }
  //#endregion
}
