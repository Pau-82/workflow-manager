// Public API del bounded context `notifications`.

// --- Dominio ---
export * from './domain/aggregate/notification.aggregate.js';
export * from './domain/aggregate/interface/notification.props.js';
export * from './domain/value-objects/notification-id.vo.js';
export * from './domain/value-objects/alert-event-reference.vo.js';
export * from './domain/value-objects/notification-target.vo.js';
export * from './domain/value-objects/notification-message.vo.js';
export * from './domain/ports/notification.repository.port.js';
export * from './domain/ports/notification-creator.port.js';
export * from './domain/errors/notification-id.error.js';
export * from './domain/errors/alert-event-reference.error.js';
export * from './domain/errors/notification-target.error.js';
export * from './domain/errors/notification-message.error.js';
export * from './domain/errors/notification.error.js';

// --- Aplicación ---
export * from './application/mappers/interface/notification.dto.js';
export * from './application/mappers/notification.mapper.js';

export * from './application/list-notifications/list-notifications.handler.js';
export * from './application/list-notifications/list-notifications.module.js';
export * from './application/list-notifications/interface/list-notifications.output.dto.js';
export * from './application/list-notifications/errors/list-notifications.error.js';

// --- Infraestructura expuesta (capacidad para otros módulos) ---
export * from './infrastructure/notification-creator.module.js';
