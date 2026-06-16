import { Inject, Injectable } from '@nestjs/common';
import {
  Result,
  LOGGER,
  UNIT_OF_WORK,
  assertNever,
  type Logger,
  type IUnitOfWork,
} from '@org/shared';
import {
  WORKFLOW_REPOSITORY,
  type IWorkflowRepository,
  type Workflow,
  type RenderValues,
  type TriggerContextSnapshot,
} from '@org/workflows';
import {
  NOTIFICATION_CREATOR,
  type INotificationCreator,
} from '@org/notifications';
import { AlertEvent } from '../../domain/aggregate/alert-event.aggregate.js';
import {
  ALERT_EVENT_REPOSITORY,
  type IAlertEventRepository,
} from '../../domain/ports/alert-event.repository.port.js';
import {
  EMAIL_SENDER,
  type IEmailSender,
} from '../../domain/ports/email-sender.port.js';
import { DuplicateOpenEventError } from '../../domain/errors/duplicate-open-event.error.js';
import {
  SimulateTriggerError,
  SIMULATE_TRIGGER_ERRORS,
} from './errors/simulate-trigger.error.js';
import { CONTEXT } from './constants/simulate-trigger.constants.js';
import type { SimulateTriggerInput } from './interface/simulate-trigger.input.dto.js';
import type { SimulateTriggerOutput } from './interface/simulate-trigger.output.dto.js';

@Injectable()
export class SimulateTriggerHandler {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly workflowRepository: IWorkflowRepository,
    @Inject(ALERT_EVENT_REPOSITORY)
    private readonly alertRepository: IAlertEventRepository,
    @Inject(NOTIFICATION_CREATOR)
    private readonly notificationCreator: INotificationCreator,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(
    input: SimulateTriggerInput,
  ): Promise<Result<SimulateTriggerOutput, SimulateTriggerError>> {
    this.logger.log('Simulating trigger', CONTEXT, { ...input });

    // 1) Workflow (get → NotFound si no existe).
    const workflowResult = await this.fetchWorkflow(input.workflowId);
    if (workflowResult.isFailure()) {
      return Result.fail<SimulateTriggerOutput, SimulateTriggerError>(workflowResult.error);
    }
    const workflow = workflowResult.value;

    // 2) ¿Dispara? (activo + condición). Si no, no toca la base.
    if (!workflow.shouldTrigger(input.observedValue)) {
      this.logger.log('Workflow did not trigger', CONTEXT, { ...input });

      return Result.ok<SimulateTriggerOutput, SimulateTriggerError>({
        triggered: false,
        duplicate: false,
      });
    }

    // 3) No-duplicados: ¿ya hay un evento abierto? (find)
    const eventResult = await this.findOpenEvent(input.workflowId);
    if (eventResult.isFailure()) {
      return Result.fail<SimulateTriggerOutput, SimulateTriggerError>(
        eventResult.error,
      );
    }

    if (eventResult.value) {
      this.logger.log('Trigger skipped: open event already exists', CONTEXT, {
        workflowId: input.workflowId,
        existingEventId: eventResult.value.id,
      });

      return Result.ok<SimulateTriggerOutput, SimulateTriggerError>({
        triggered: true,
        duplicate: true,
        eventId: eventResult.value.id,
      });
    }

    // 4) Creación ATÓMICA (evento + notificaciones in-app) dentro del UnitOfWork.
    const context = workflow.captureTriggerContext(input.observedValue);

    const renderedMessage = workflow.renderMessage(
      SimulateTriggerHandler.buildValues(context),
    );

    const committed = await this.unitOfWork.execute((tx) =>
      this.persistAtomically(workflow, context, renderedMessage, tx),
    );

    if (committed.isFailure()) {
      // Carrera contra el índice único parcial: lo tratamos como duplicado, no error.
      if (committed.error.type === SIMULATE_TRIGGER_ERRORS.DUPLICATE_OPEN_EVENT) {
        return Result.ok<SimulateTriggerOutput, SimulateTriggerError>({
          triggered: true,
          duplicate: true,
        });
      }

      return Result.fail<SimulateTriggerOutput, SimulateTriggerError>(
        committed.error as SimulateTriggerError,
      );
    }

    // 5) POST-COMMIT: emails (un fallo NO revierte ni cambia el resultado).
    await this.notifyByEmail(workflow, renderedMessage);

    // 6) OK.
    const eventId = committed.value;
    this.logger.log('Workflow triggered', CONTEXT, { eventId, renderedMessage });
    return Result.ok<SimulateTriggerOutput, SimulateTriggerError>({
      triggered: true,
      duplicate: false,
      eventId,
      renderedMessage,
    });
  }


  private async fetchWorkflow(
    workflowId: string,
  ): Promise<Result<Workflow, SimulateTriggerError>> {
    const result = await this.workflowRepository.getById(workflowId);
    if (result.isFailure()) {
      const error = SimulateTriggerError.notFound(
        result.error.reason,
        result.error.metadata,
      );

      return Result.fail<Workflow, SimulateTriggerError>(error);
    }

    return Result.ok<Workflow, SimulateTriggerError>(result.value);
  }

  private async findOpenEvent(
    workflowId: string,
  ): Promise<Result<AlertEvent | null, SimulateTriggerError>> {
    const result = await Result.executeAsync(() =>
      this.alertRepository.findOpenEventByWorkflow(workflowId),
    );

    if (result.isFailure()) {
      const error = SimulateTriggerError.persistenceFailed(result.error.reason);

      return Result.fail<AlertEvent | null, SimulateTriggerError>(error);
    }

    return Result.ok<AlertEvent | null, SimulateTriggerError>(result.value);
  }

  /** Trabajo transaccional: crea el evento y sus notificaciones in-app, o aborta. */
  private async persistAtomically(
    workflow: Workflow,
    context: TriggerContextSnapshot,
    renderedMessage: string,
    tx: unknown,
  ): Promise<Result<string, SimulateTriggerError>> {
    const created = AlertEvent.create({
      workflowId: workflow.id,
      triggerContext: context,
      renderedMessage,
    });
    if (created.isFailure()) {
      return Result.fail<string, SimulateTriggerError>(
        SimulateTriggerError.invalidEvent(
          created.error.reason,
          created.error.metadata,
        ),
      );
    }
    const event = created.value;

    const saved = await Result.executeAsync(() =>
      this.alertRepository.save(event, tx),
    );
    if (saved.isFailure()) {
      if (saved.error instanceof DuplicateOpenEventError) {
        return Result.fail<string, SimulateTriggerError>(
          SimulateTriggerError.duplicateOpenEvent(saved.error.reason),
        );
      }
      return Result.fail<string, SimulateTriggerError>(
        SimulateTriggerError.persistenceFailed(saved.error.reason),
      );
    }

    const notified = await this.createInAppNotifications(
      workflow,
      event.id,
      renderedMessage,
      tx,
    );
    if (notified.isFailure()) {
      return Result.fail<string, SimulateTriggerError>(notified.error);
    }

    return Result.ok<string, SimulateTriggerError>(event.id);
  }

  /** Ruteo por canal (switch exhaustivo): in-app dentro de la transacción. */
  private async createInAppNotifications(
    workflow: Workflow,
    eventId: string,
    renderedMessage: string,
    tx: unknown,
  ): Promise<Result<void, SimulateTriggerError>> {
    for (const recipient of workflow.recipients) {
      switch (recipient.channel) {
        case 'in-app': {
          const created = await this.notificationCreator.create(
            { alertEventId: eventId, target: recipient.target, message: renderedMessage },
            tx,
          );
          if (created.isFailure()) {
            return Result.fail<void, SimulateTriggerError>(
              SimulateTriggerError.persistenceFailed(created.error.reason),
            );
          }
          break;
        }
        case 'email':
          // Los emails se envían POST-COMMIT, fuera de la transacción.
          break;
        default:
          return assertNever(recipient);
      }
    }

    return Result.ok<void, SimulateTriggerError>(undefined);
  }

  /** POST-COMMIT: envía emails; loguea fallos sin tumbar la operación. */
  private async notifyByEmail(
    workflow: Workflow,
    renderedMessage: string,
  ): Promise<void> {
    for (const recipient of workflow.recipients) {
      if (recipient.channel !== 'email') {
        continue;
      }
      
      try {
        const sent = await this.emailSender.send(recipient.address, renderedMessage);

        if (sent.isFailure()) {
          this.logger.warn('Email send failed', CONTEXT, {
            recipient: recipient.address,
            reason: sent.error.reason,
          });
        }

      } catch (error) {
        this.logger.logUnknownError(error, CONTEXT);
      }
    }
  }

  /** Diccionario de variables para el render, derivado del contexto del disparo. */
  private static buildValues(context: TriggerContextSnapshot): RenderValues {
    if (context.type === 'threshold') {
      return {
        metrica: context.metricName,
        metricName: context.metricName,
        operador: context.operator,
        umbral: context.threshold,
        valor: context.observedValue,
        observado: context.observedValue,
      };
    }
    return {
      base: context.baseValue,
      desvio: Math.round(context.actualDeviation * 100) / 100,
      desviacion: context.deviationPercent,
      direccion: context.direction,
      valor: context.observedValue,
      observado: context.observedValue,
    };
  }
}
