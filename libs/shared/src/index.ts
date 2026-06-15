// Public API de la lib compartida (dominio — isomórfico, sin framework).
// El logger concreto (NestJS) se importa aparte vía `@org/shared/infrastructure`.
export * from './domain/value-object/index.js';
export * from './domain/errors/result/index.js';
export * from './domain/ports/logger.port.js';
