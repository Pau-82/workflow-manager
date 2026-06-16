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
  //#endregion

  //#region writes
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
