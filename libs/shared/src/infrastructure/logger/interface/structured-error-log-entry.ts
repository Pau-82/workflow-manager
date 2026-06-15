import { ErrorLayer } from '../../../domain/errors/result/layered-error.js';
import { StructuredLogEntry } from './structured-log-entry.js';

export interface StructuredErrorLogEntry extends StructuredLogEntry {
    errorType: string;
    errorContext: string;
    errorLayer: ErrorLayer;
    reason: string;
    metadata?: Record<string, unknown>;
    stack?: string;
}
