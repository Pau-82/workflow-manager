import { Result, type LayeredError } from '@org/shared';
import { NotificationId } from '../value-objects/notification-id.vo.js';
import { AlertEventReference } from '../value-objects/alert-event-reference.vo.js';
import { NotificationTarget } from '../value-objects/notification-target.vo.js';
import { NotificationMessage } from '../value-objects/notification-message.vo.js';
import { NotificationError } from '../errors/notification.error.js';
import type {
  CreateNotificationProps,
  NotificationPersistenceProps,
} from './interface/notification.props.js';

/** Snapshot crudo común que arma/valida los VOs internos de la notificación. */
interface NotificationSnapshot {
  alertEventId: string;
  target: string;
  message: string;
}

/**
 * Agregado raíz `Notification`: el registro de un aviso in-app generado por un
 * disparo. Agregado SIMPLE (sin comportamiento rico): referencia al evento SOLO por
 * id. Construcción/reconstitución vía Result (no tira). Internamente VOs; los getters
 * exponen primitivos hacia la frontera.
 */
export class Notification {
  private constructor(
    private readonly _id: NotificationId,
    private readonly _alertEventId: AlertEventReference,
    private readonly _target: NotificationTarget,
    private readonly _message: NotificationMessage,
    private readonly _createdAt: Date,
  ) {}

  //#region construction
  /** Crea una notificación nueva, con id generado y createdAt = ahora (o el provisto). */
  static create(props: CreateNotificationProps): Result<Notification, LayeredError> {
    return Notification.build(
      NotificationId.generate().value,
      props.createdAt ?? new Date(),
      props,
    );
  }

  /** Reconstituye desde persistencia (valida vía los VOs, incluido el id). */
  static fromPersistence(
    raw: NotificationPersistenceProps,
  ): Result<Notification, LayeredError> {
    return Notification.build(raw.id, raw.createdAt, raw);
  }

  /** Construye y valida TODO; acumula los errores (no corta en el primero). */
  private static build(
    idValue: string,
    createdAt: Date,
    snapshot: NotificationSnapshot,
  ): Result<Notification, LayeredError> {
    const idResult = NotificationId.create(idValue);
    const alertEventRefResult = AlertEventReference.create(snapshot.alertEventId);
    const targetResult = NotificationTarget.create(snapshot.target);
    const messageResult = NotificationMessage.create(snapshot.message);

    const combined = Result.combine([
      idResult,
      alertEventRefResult,
      targetResult,
      messageResult,
    ]);
    const errors: LayeredError[] = [...combined.errors];

    if (!Notification.isValidDate(createdAt)) {
      errors.push(NotificationError.invalidCreatedAt());
    }

    if (errors.length > 0) {
      return Result.fail<Notification>(
        errors.length === 1
          ? errors[0]
          : NotificationError.invalidComposition(errors),
      );
    }

    return Result.ok(
      new Notification(
        idResult.value,
        alertEventRefResult.value,
        targetResult.value,
        messageResult.value,
        createdAt,
      ),
    );
  }

  private static isValidDate(value: Date): boolean {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }
  //#endregion

  //#region accessors (exponen primitivos hacia la frontera)
  get id(): string {
    return this._id.value;
  }
  get alertEventId(): string {
    return this._alertEventId.value;
  }
  get target(): string {
    return this._target.target;
  }
  get message(): string {
    return this._message.message;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  //#endregion
}
