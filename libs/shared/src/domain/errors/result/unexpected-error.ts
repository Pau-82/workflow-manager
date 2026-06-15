import { LayeredError } from './layered-error.js';

export class UnexpectedError extends LayeredError {
    constructor(context: string, reason: string) {
        super({
            context,
            type: 'UNEXPECTED_ERROR',
            reason,
        });
    }
}
