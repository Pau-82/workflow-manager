import { Injectable } from '@nestjs/common';
import { Result } from '../../domain/errors/result/result.js';
import { UnexpectedError } from '../../domain/errors/result/unexpected-error.js';
import { LayeredError } from '../../domain/errors/result/layered-error.js';
import type { IUnitOfWork } from '../../domain/ports/unit-of-work.port.js';
import { PrismaService } from '../prisma/prisma.service.js';

const CONTEXT = 'PrismaUnitOfWork';

/**
 * Señal interna para abortar `$transaction` cuando el callback devuelve
 * `Result.fail`. Prisma sólo hace rollback si el callback de `$transaction` LANZA;
 * por eso, ante un fail "esperado", lanzamos esto y lo recapturamos afuera para
 * devolver el Result original (sin commitear).
 */
class RollbackSignal extends Error {
  constructor(readonly result: Result<unknown, LayeredError>) {
    super('UnitOfWork rollback');
  }
}

/** Adaptador de IUnitOfWork sobre `prisma.$transaction`. */
@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(
    work: (tx: unknown) => Promise<Result<T, LayeredError>>,
  ): Promise<Result<T, LayeredError>> {
    try {
      // El txClient (Prisma.TransactionClient) viaja como `tx` opaco al callback.
      return await this.prisma.$transaction(async (txClient) => {
        const result = await work(txClient);

        if (result.isFailure()) {
          // Forzar rollback: abortamos la transacción lanzando la señal.
          throw new RollbackSignal(result);
        }

        return result;
      });
    } catch (error) {
      if (error instanceof RollbackSignal) {
        // Fail "esperado": la transacción ya hizo rollback; devolvemos el Result.
        return error.result as Result<T, LayeredError>;
      }
      // Excepción inesperada: la transacción hizo rollback; normalizamos a Result.fail.
      if (error instanceof LayeredError) {
        return Result.fail<T>(error);
      }

      const message = error instanceof Error ? error.message : String(error);

      return Result.fail<T>(new UnexpectedError(CONTEXT, message));
    }
  }
}
