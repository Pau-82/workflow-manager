// Public API de infraestructura compartida (solo backend — depende de NestJS).
// Se importa vía `@org/shared/infrastructure`, separado del barrel de dominio
// para que el frontend no bundlee NestJS.
export * from './logger/index.js';
