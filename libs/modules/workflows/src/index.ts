// Public API del módulo `workflows`.

// --- Dominio ---
export * from './domain/aggregate/workflow.aggregate.js';
export * from './domain/aggregate/interface/workflow.props.js';
export * from './domain/value-objects/workflow-id.vo.js';
export * from './domain/value-objects/workflow-activation.vo.js';
export * from './domain/value-objects/workflow-name.vo.js';
export * from './domain/value-objects/comparison-operator.vo.js';
export * from './domain/value-objects/trigger-condition.vo.js';
export * from './domain/value-objects/message-template.vo.js';
export * from './domain/value-objects/recipient.vo.js';
export * from './domain/ports/workflow.repository.port.js';
export * from './domain/errors/workflow-name.error.js';
export * from './domain/errors/comparison-operator.error.js';
export * from './domain/errors/trigger-condition.error.js';
export * from './domain/errors/message-template.error.js';
export * from './domain/errors/recipient.error.js';
export * from './domain/errors/workflow.error.js';
export * from './domain/errors/workflow-not-found.error.js';
export * from './domain/errors/workflow-id.error.js';

// --- Aplicación ---
export * from './application/mappers/interface/workflow.dto.js';
export * from './application/mappers/workflow.mapper.js';

export * from './application/create-workflow/create-workflow.handler.js';
export * from './application/create-workflow/create-workflow.module.js';
export * from './application/create-workflow/interface/create-workflow.input.dto.js';
export * from './application/create-workflow/interface/create-workflow.output.dto.js';
export * from './application/create-workflow/errors/create-workflow.error.js';

export * from './application/get-workflow/get-workflow.handler.js';
export * from './application/get-workflow/get-workflow.module.js';
export * from './application/get-workflow/interface/get-workflow.input.dto.js';
export * from './application/get-workflow/interface/get-workflow.output.dto.js';
export * from './application/get-workflow/errors/get-workflow.error.js';

export * from './application/list-workflows/list-workflows.handler.js';
export * from './application/list-workflows/list-workflows.module.js';
export * from './application/list-workflows/interface/list-workflows.output.dto.js';
export * from './application/list-workflows/errors/list-workflows.error.js';

export * from './application/update-workflow/update-workflow.handler.js';
export * from './application/update-workflow/update-workflow.module.js';
export * from './application/update-workflow/interface/update-workflow.input.dto.js';
export * from './application/update-workflow/interface/update-workflow.output.dto.js';
export * from './application/update-workflow/errors/update-workflow.error.js';

export * from './application/activate-workflow/activate-workflow.handler.js';
export * from './application/activate-workflow/activate-workflow.module.js';
export * from './application/activate-workflow/interface/activate-workflow.input.dto.js';
export * from './application/activate-workflow/interface/activate-workflow.output.dto.js';
export * from './application/activate-workflow/errors/activate-workflow.error.js';

export * from './application/deactivate-workflow/deactivate-workflow.handler.js';
export * from './application/deactivate-workflow/deactivate-workflow.module.js';
export * from './application/deactivate-workflow/interface/deactivate-workflow.input.dto.js';
export * from './application/deactivate-workflow/interface/deactivate-workflow.output.dto.js';
export * from './application/deactivate-workflow/errors/deactivate-workflow.error.js';
