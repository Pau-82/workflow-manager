import type { LayeredError } from '../errors/result/layered-error.js';
import type { Result } from '../errors/result/result.js';

/**
 * Puerto `UnitOfWork`: ejecuta una unidad de trabajo dentro de UNA transacción
 * atómica. Permite que un caso de uso coordine escrituras sobre varios agregados
 * (posiblemente de módulos distintos) con garantía todo-o-nada.
 *
 * El contexto transaccional (`tx`) es OPACO: el dominio/aplicación no conoce Prisma.
 * El adaptador concreto (infraestructura) lo interpreta; los repos/creators que
 * aceptan `tx` lo narrowean a su cliente concreto. Mismo criterio que
 * `INotificationCreator`.
 */
export interface IUnitOfWork {
  /**
   * Abre una transacción y ejecuta `work(tx)`:
   * - si devuelve `Result.ok`  => commit y se devuelve ese ok.
   * - si devuelve `Result.fail` => rollback y se devuelve ese fail.
   * - si lanza una excepción    => rollback y se devuelve `Result.fail`.
   * Nunca tira hacia afuera: siempre devuelve un `Result`.
   */
  execute<T>(
    work: (tx: unknown) => Promise<Result<T, LayeredError>>,
  ): Promise<Result<T, LayeredError>>;
}

/** Token de inyección del puerto (DI por interfaz en NestJS). */
export const UNIT_OF_WORK = Symbol('UnitOfWork');
