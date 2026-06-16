import { Injectable } from '@nestjs/common';
import { Result, type LayeredError } from '@org/shared';
import { Notification } from '../domain/aggregate/notification.aggregate.js';
import type {
  CreateNotificationInput,
  INotificationCreator,
} from '../domain/ports/notification-creator.port.js';
import {
  PrismaNotificationRepository,
  type PrismaTransactionClient,
} from './prisma-notification.repository.js';

/**
 * Implementación de INotificationCreator. Crea el agregado (Notification.create) y lo
 * persiste vía el repo. Participa de una transacción externa si le pasan el cliente
 * transaccional (`tx`): lo narrowea al cliente Prisma y se lo delega al repo. Esta es
 * la pieza que el V10 (SimulateTrigger en alerts) inyecta dentro de su UnitOfWork.
 */
@Injectable()
export class PrismaNotificationCreator implements INotificationCreator {
  constructor(private readonly repository: PrismaNotificationRepository) {}

  async create(
    input: CreateNotificationInput,
    tx?: unknown,
  ): Promise<Result<void, LayeredError>> {
    const created = Notification.create(input);
    if (created.isFailure()) {
      return Result.fail<void>(created.error);
    }

    const persisted = await Result.executeAsync(() =>
      this.repository.save(
        created.value,
        tx as PrismaTransactionClient | undefined,
      ),
    );
    if (persisted.isFailure()) {
      return Result.fail<void>(persisted.error);
    }

    return Result.ok<void>(undefined);
  }
}
