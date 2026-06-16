import { Global, Module } from '@nestjs/common';
import { UNIT_OF_WORK } from '../../domain/ports/unit-of-work.port.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrismaUnitOfWork } from './prisma-unit-of-work.js';

/**
 * Provee el `UnitOfWork` de forma global. Bindea el puerto (token) a la impl Prisma
 * para que cualquier caso de uso inyecte la abstracción y no la clase concreta.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    PrismaUnitOfWork,
    { provide: UNIT_OF_WORK, useExisting: PrismaUnitOfWork },
  ],
  exports: [UNIT_OF_WORK, PrismaUnitOfWork],
})
export class UnitOfWorkModule {}
