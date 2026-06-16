// Public API de infraestructura compartida (solo backend — depende de NestJS).
// Se importa vía `@org/shared/infrastructure`, separado del barrel de dominio
// para que el frontend no bundlee NestJS.
export * from './logger/index.js';
export * from './prisma/prisma.service.js';
export * from './prisma/prisma.module.js';
export * from './unit-of-work/prisma-unit-of-work.js';
export * from './unit-of-work/unit-of-work.module.js';
