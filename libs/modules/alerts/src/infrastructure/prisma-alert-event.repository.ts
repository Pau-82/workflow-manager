import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, type LayeredError } from '@org/shared';
import { PrismaService } from '@org/shared/infrastructure';
import { AlertEvent } from '../domain/aggregate/alert-event.aggregate.js';
import type { AlertEventPersistenceProps } from '../domain/aggregate/interface/alert-event.props.js';
import type {
  EventHistoryFilters,
  EventHistoryQuery,
  IAlertEventRepository,
} from '../domain/ports/alert-event.repository.port.js';
import type { TriggerContextInput } from '../domain/value-objects/trigger-context/trigger-context.vo.js';
import { AlertEventNotFoundError } from '../domain/errors/alert-event-not-found.error.js';
import { DuplicateOpenEventError } from '../domain/errors/duplicate-open-event.error.js';

/** Cliente transaccional opcional (para participar de un UnitOfWork). */
type PrismaTransactionClient = Prisma.TransactionClient;

type AlertEventRow = Prisma.AlertEventGetPayload<object>;

/** Adaptador Prisma del puerto IAlertEventRepository. El modelo Prisma NO es el agregado. */
@Injectable()
export class PrismaAlertEventRepository implements IAlertEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  //#region reads
  async history(
    query: EventHistoryQuery,
    tx?: PrismaTransactionClient,
  ): Promise<AlertEvent[]> {
    const db = tx ?? this.prisma;
    const rows = await db.alertEvent.findMany({
      where: PrismaAlertEventRepository.toWhere(query),
      // Orden DESC por triggeredAt, desempate estable por id.
      orderBy: [{ triggeredAt: 'desc' }, { id: 'desc' }],
      skip: query.offset,
      take: query.limit,
    });
    return rows.map((row) => {
      const result = AlertEvent.fromPersistence(
        PrismaAlertEventRepository.toPersistenceProps(row),
      );
      if (result.isFailure()) {
        // Fila corrupta en base: anomalía, no resultado válido.
        throw result.error;
      }
      return result.value;
    });
  }

  async count(
    filters: EventHistoryFilters,
    tx?: PrismaTransactionClient,
  ): Promise<number> {
    const db = tx ?? this.prisma;
    return db.alertEvent.count({
      where: PrismaAlertEventRepository.toWhere(filters),
    });
  }

  async getById(
    id: string,
    tx?: PrismaTransactionClient,
  ): Promise<Result<AlertEvent, LayeredError>> {
    const db = tx ?? this.prisma;
    const row = await db.alertEvent.findUnique({ where: { id } });
    if (!row) {
      return Result.fail<AlertEvent>(AlertEventNotFoundError.withId(id));
    }
    return AlertEvent.fromPersistence(
      PrismaAlertEventRepository.toPersistenceProps(row),
    );
  }

  async findOpenEventByWorkflow(
    workflowId: string,
    tx?: unknown,
  ): Promise<AlertEvent | null> {
    const db = (tx as PrismaTransactionClient | undefined) ?? this.prisma;
    const row = await db.alertEvent.findFirst({
      where: { workflowId, status: 'abierto' },
    });
    if (!row) {
      return null;
    }
    const result = AlertEvent.fromPersistence(
      PrismaAlertEventRepository.toPersistenceProps(row),
    );
    if (result.isFailure()) {
      // Fila corrupta en base: anomalía, no resultado válido.
      throw result.error;
    }
    return result.value;
  }
  //#endregion

  //#region writes
  async save(event: AlertEvent, tx?: unknown): Promise<void> {
    const db = (tx as PrismaTransactionClient | undefined) ?? this.prisma;
    try {
      await db.alertEvent.create({
        data: PrismaAlertEventRepository.toCreateInput(event),
      });
    } catch (error) {
      // Índice único parcial (un abierto por workflow) → P2002 ante carrera.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw DuplicateOpenEventError.forWorkflow(event.workflowId);
      }
      throw error;
    }
  }

  async update(event: AlertEvent, tx?: PrismaTransactionClient): Promise<void> {
    const db = tx ?? this.prisma;
    await db.alertEvent.update({
      where: { id: event.id },
      // De un evento sólo cambia su estado de resolución; el resto es inmutable.
      data: {
        status: event.status,
        resolvedAt: event.resolvedAt,
        resolutionNote: event.resolutionNote,
      },
    });
  }
  //#endregion

  //#region mapping (modelo Prisma <-> agregado)
  private static toCreateInput(
    event: AlertEvent,
  ): Prisma.AlertEventUncheckedCreateInput {
    return {
      id: event.id,
      workflowId: event.workflowId,
      triggeredAt: event.triggeredAt,
      ...PrismaAlertEventRepository.flattenContext(event.triggerContext),
      renderedMessage: event.renderedMessage,
      status: event.status,
      resolvedAt: event.resolvedAt,
      resolutionNote: event.resolutionNote,
    };
  }

  private static flattenContext(
    context: AlertEvent['triggerContext'],
  ): Pick<
    Prisma.AlertEventUncheckedCreateInput,
    | 'contextType'
    | 'metricName'
    | 'operator'
    | 'threshold'
    | 'baseValue'
    | 'deviationPercent'
    | 'direction'
    | 'actualDeviation'
    | 'observedValue'
  > {
    if (context.type === 'threshold') {
      return {
        contextType: 'threshold',
        metricName: context.metricName,
        operator: context.operator,
        threshold: context.threshold,
        observedValue: context.observedValue,
        baseValue: null,
        deviationPercent: null,
        direction: null,
        actualDeviation: null,
      };
    }
    return {
      contextType: 'variance',
      baseValue: context.baseValue,
      deviationPercent: context.deviationPercent,
      direction: context.direction,
      actualDeviation: context.actualDeviation,
      observedValue: context.observedValue,
      metricName: null,
      operator: null,
      threshold: null,
    };
  }

  private static toWhere(
    filters: EventHistoryFilters,
  ): Prisma.AlertEventWhereInput {
    return {
      ...(filters.workflowId ? { workflowId: filters.workflowId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
  }

  private static toPersistenceProps(
    row: AlertEventRow,
  ): AlertEventPersistenceProps {
    return {
      id: row.id,
      workflowId: row.workflowId,
      triggeredAt: row.triggeredAt,
      triggerContext: PrismaAlertEventRepository.unflattenContext(row),
      renderedMessage: row.renderedMessage,
      status: row.status,
      resolvedAt: row.resolvedAt,
      resolutionNote: row.resolutionNote,
    };
  }

  private static unflattenContext(row: AlertEventRow): TriggerContextInput {
    if (row.contextType === 'threshold') {
      return {
        type: 'threshold',
        metricName: row.metricName ?? '',
        operator: row.operator ?? '',
        threshold: row.threshold ?? Number.NaN,
        observedValue: row.observedValue,
      };
    }
    return {
      type: 'variance',
      baseValue: row.baseValue ?? Number.NaN,
      deviationPercent: row.deviationPercent ?? Number.NaN,
      direction: row.direction ?? '',
      observedValue: row.observedValue,
      actualDeviation: row.actualDeviation ?? Number.NaN,
    };
  }
  //#endregion
}
