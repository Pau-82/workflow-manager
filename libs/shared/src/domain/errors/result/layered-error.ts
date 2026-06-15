export type ErrorLayer = 'domain' | 'application' | 'infrastructure';

export interface LayeredErrorProps {
    context: string;
    type: string;
    reason: string;
    layer?: ErrorLayer;
    metadata?: Record<string, unknown>;
}

export class LayeredError extends Error {
    // `layer` queda garantizado tras el constructor (default 'domain'), por eso
    // el tipo interno lo marca como requerido aunque en los props sea opcional.
    private readonly props: LayeredErrorProps & { layer: ErrorLayer };
    private readonly _timestamp: Date;

    protected constructor(props: LayeredErrorProps) {
        super(props.reason);
        this.name = this.constructor.name;
        this.props = {
            ...props,
            layer: props.layer ?? 'domain',
        };
        this._timestamp = new Date();
        // captureStackTrace es específico de V8 (Node); guardamos por si `shared`
        // se ejecuta en un runtime que no lo tiene (browser).
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    get context(): string { return this.props.context; }
    get type(): string { return this.props.type; }
    get reason(): string { return this.props.reason; }
    get layer(): ErrorLayer { return this.props.layer; }
    get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
    get timestamp(): Date { return this._timestamp; }

    public override toString(): string {
        return `[${this.layer}][${this.context}] ${this.type}: ${this.reason}`;
    }
}
