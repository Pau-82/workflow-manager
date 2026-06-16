import { Module, Global } from '@nestjs/common';
import { LOGGER } from '../../domain/ports/logger.port.js';
import { StructuredLoggerService } from './structured-logger.service.js';

@Global()
@Module({
    providers: [
        StructuredLoggerService,
        // Bindea el puerto `Logger` (token) a la impl concreta, para que la
        // aplicación inyecte la abstracción y no la clase de infraestructura.
        { provide: LOGGER, useExisting: StructuredLoggerService },
    ],
    exports: [StructuredLoggerService, LOGGER],
})
export class StructuredLoggerModule {}
