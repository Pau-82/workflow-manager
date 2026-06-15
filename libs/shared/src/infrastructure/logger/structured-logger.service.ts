import { Injectable, Logger as NestLogger } from "@nestjs/common";
import { LayeredError } from "../../domain/errors/result/layered-error.js";
import { Logger } from "../../domain/ports/logger.port.js";
import { StructuredErrorLogEntry } from "./interface/structured-error-log-entry.js";
import { StructuredLogEntry } from "./interface/structured-log-entry.js";

/**
 * Logger estructurado e inyectable.
 * - Loguea campos separados (no strings concatenados) para facilitar queries en herramientas de observabilidad.
 * - Integrado con LayeredError: extrae context, type, reason, metadata automáticamente.
 * - Stack trace solo para errores de infraestructura.
 * - Sanitiza datos para evitar referencias circulares y redacta campos sensibles.
 */
@Injectable()
export class StructuredLoggerService implements Logger {
    private readonly logger = new NestLogger();
    private readonly includeStackForLayers = ['infrastructure'];
    private readonly redactedKeys = ['password', 'token', 'secret', 'apitoken', 'apikey', 'creditcard', 'authorization'];

    /**
     * Log informativo con datos estructurados.
     */
    public log(message: string, context?: string, data?: Record<string, unknown>): void {
        const entry = this.buildEntry(message, context, data);
        this.logger.log(entry, context);
    }

    /**
     * Log de warning con datos estructurados.
     */
    public warn(message: string, context?: string, data?: Record<string, unknown>): void {
        const entry = this.buildEntry(message, context, data);
        this.logger.warn(entry, context);
    }

    /**
     * Log de debug con datos estructurados.
     */
    public debug(message: string, context?: string, data?: Record<string, unknown>): void {
        const entry = this.buildEntry(message, context, data);
        this.logger.debug(entry, context);
    }

    /**
     * Log de error genérico con datos estructurados.
     */
    public error(message: string, context?: string, data?: Record<string, unknown>): void {
        const entry = this.buildEntry(message, context, data);
        this.logger.error(entry, undefined, context);
    }

    /**
     * Log de un LayeredError.
     * Extrae automáticamente context, type, reason, metadata, layer.
     * Incluye stack trace solo para errores de infraestructura.
     */
    public logLayeredError(error: LayeredError, callerContext?: string): void {
        const includeStack = this.includeStackForLayers.includes(error.layer);

        const entry: StructuredErrorLogEntry = {
            message: error.reason,
            context: callerContext,
            timestamp: error.timestamp.toISOString(),
            errorType: error.type,
            errorContext: error.context,
            errorLayer: error.layer,
            reason: error.reason,
            metadata: this.safeSanitize(error.metadata),
            stack: includeStack ? error.stack : undefined,
        };

        this.logger.error(entry, includeStack ? error.stack : undefined, callerContext);
    }

    /**
     * Log de un error desconocido (Error nativo, string, o cualquier cosa).
     * Normaliza el error y lo loguea de forma estructurada.
     * Si es un LayeredError, delega a logLayeredError.
     */
    public logUnknownError(error: unknown, callerContext?: string): void {
        if (error instanceof LayeredError) {
            return this.logLayeredError(error, callerContext);
        }

        if (error instanceof Error) {
            const entry: StructuredErrorLogEntry = {
                message: error.message,
                context: callerContext,
                timestamp: new Date().toISOString(),
                errorType: error.name,
                errorContext: callerContext || 'Unknown',
                errorLayer: 'infrastructure',
                reason: error.message,
                stack: error.stack,
            };
            this.logger.error(entry, error.stack, callerContext);
            return;
        }

        const message = typeof error === 'string' ? error : 'Unknown error';
        const entry = this.buildEntry(message, callerContext, {
            originalError: this.safeSanitize(error),
        });
        this.logger.error(entry, undefined, callerContext);
    }


    /**
     * Construye una entrada de log estructurada.
     */
    private buildEntry(message: string, context?: string, data?: Record<string, unknown>): StructuredLogEntry {
        return {
            message,
            context,
            timestamp: new Date().toISOString(),
            data: data ? this.safeSanitize(data) : undefined,
        };
    }

    /**
     * Sanitiza datos para evitar referencias circulares y redacta campos sensibles.
     * Si la serialización falla, retorna un objeto indicando el error.
     */
    private safeSanitize(data: unknown): Record<string, unknown> | undefined {
        if (!data) return undefined;

        try {
            return JSON.parse(JSON.stringify(data, (key, value) => {
                if (this.redactedKeys.includes(key.toLowerCase())) {
                    return '***REDACTED***';
                }
                return value;
            }));
        } catch {
            return {
                _logError: 'Circular reference or serialization failed',
                _type: typeof data,
            };
        }
    }
}
