import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@org/shared/infrastructure';
import { Notification } from '../domain/aggregate/notification.aggregate.js';
import type { NotificationPersistenceProps } from '../domain/aggregate/interface/notification.props.js';
import type { INotificationRepository } from '../domain/ports/notification.repository.port.js';

/** Cliente transaccional opcional (para participar de un UnitOfWork). */
export type PrismaTransactionClient = Prisma.TransactionClient;

type NotificationRow = Prisma.NotificationGetPayload<object>;

/** Adaptador Prisma del puerto INotificationRepository. El modelo Prisma NO es el agregado. */
@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  //#region writes
  async save(
    notification: Notification,
    tx?: PrismaTransactionClient,
  ): Promise<void> {
    const db = tx ?? this.prisma;
    await db.notification.create({
      data: PrismaNotificationRepository.toCreateInput(notification),
    });
  }
  //#endregion

  //#region reads
  async list(tx?: PrismaTransactionClient): Promise<Notification[]> {
    const db = tx ?? this.prisma;
    const rows = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => {
      const result = Notification.fromPersistence(
        PrismaNotificationRepository.toPersistenceProps(row),
      );
      if (result.isFailure()) {
        // Fila corrupta en base: anomalía, no resultado válido.
        throw result.error;
      }
      return result.value;
    });
  }
  //#endregion

  //#region mapping (modelo Prisma <-> agregado)
  private static toCreateInput(
    notification: Notification,
  ): Prisma.NotificationUncheckedCreateInput {
    return {
      id: notification.id,
      alertEventId: notification.alertEventId,
      target: notification.target,
      message: notification.message,
      createdAt: notification.createdAt,
    };
  }

  private static toPersistenceProps(
    row: NotificationRow,
  ): NotificationPersistenceProps {
    return {
      id: row.id,
      alertEventId: row.alertEventId,
      target: row.target,
      message: row.message,
      createdAt: row.createdAt,
    };
  }
  //#endregion
}
