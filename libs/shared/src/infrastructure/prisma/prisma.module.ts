import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/** Provee el `PrismaService` de forma global para los repositorios. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
