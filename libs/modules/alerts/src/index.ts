// Public API del bounded context `alerts`.

// --- Dominio ---
export * from './domain/aggregate/alert-event.aggregate.js';
export * from './domain/aggregate/interface/alert-event.props.js';
export * from './domain/value-objects/alert-event-id.vo.js';
export * from './domain/value-objects/workflow-reference.vo.js';
export * from './domain/value-objects/trigger-context/index.js';
export * from './domain/value-objects/resolution/index.js';
export * from './domain/ports/alert-event.repository.port.js';
export * from './domain/ports/email-sender.port.js';
export * from './domain/errors/alert-event-id.error.js';
export * from './domain/errors/workflow-reference.error.js';
export * from './domain/errors/trigger-context.error.js';
export * from './domain/errors/resolution.error.js';
export * from './domain/errors/alert-event.error.js';
export * from './domain/errors/alert-event-not-found.error.js';
export * from './domain/errors/duplicate-open-event.error.js';

// --- Aplicación ---
export * from './application/mappers/interface/alert-event.dto.js';
export * from './application/mappers/alert-event.mapper.js';

export * from './application/list-event-history/list-event-history.handler.js';
export * from './application/list-event-history/list-event-history.module.js';
export * from './application/list-event-history/interface/list-event-history.input.dto.js';
export * from './application/list-event-history/interface/list-event-history.output.dto.js';
export * from './application/list-event-history/errors/list-event-history.error.js';

export * from './application/resolve-event/resolve-event.handler.js';
export * from './application/resolve-event/resolve-event.module.js';
export * from './application/resolve-event/interface/resolve-event.input.dto.js';
export * from './application/resolve-event/interface/resolve-event.output.dto.js';
export * from './application/resolve-event/errors/resolve-event.error.js';

export * from './application/simulate-trigger/simulate-trigger.handler.js';
export * from './application/simulate-trigger/simulate-trigger.module.js';
export * from './application/simulate-trigger/interface/simulate-trigger.input.dto.js';
export * from './application/simulate-trigger/interface/simulate-trigger.output.dto.js';
export * from './application/simulate-trigger/errors/simulate-trigger.error.js';
