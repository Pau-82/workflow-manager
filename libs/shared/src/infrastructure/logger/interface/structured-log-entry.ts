export interface StructuredLogEntry {
    message: string;
    context?: string;
    timestamp: string;
    data?: Record<string, unknown>;
}
