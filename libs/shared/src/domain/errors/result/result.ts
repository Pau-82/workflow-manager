
import { LayeredError } from './layered-error.js';
import { UnexpectedError } from './unexpected-error.js';

export class Result<T, E extends LayeredError = LayeredError> {
    private readonly _value: T | undefined;
    private readonly _error: E | undefined;
    private readonly _isSuccess: boolean;

    private constructor(isSuccess: boolean, value?: T, error?: E) {
        this._isSuccess = isSuccess;
        this._value = value;
        this._error = error;
    }

    public static ok<T, E extends LayeredError = LayeredError>(value: T): Result<T, E> {
        return new Result<T, E>(true, value, undefined);
    }

    public static fail<T, E extends LayeredError = LayeredError>(error: E): Result<T, E> {
        return new Result<T, E>(false, undefined, error);
    }

    /**
     * Evalúa un array de Results y acumula todos los errores.
     * Si todos son exitosos, retorna { success: true, values: [...] }
     * Si alguno falla, retorna { success: false, errors: [...] } con TODOS los errores.
     */
    public static combine(results: Result<unknown, LayeredError>[]): CombinedResult {
        const errors: LayeredError[] = [];
        const values: unknown[] = [];

        for (const result of results) {
            if (result.isFailure()) {
                errors.push(result.error);
            } else {
                values.push(result.value);
            }
        }

        return {
            success: errors.length === 0,
            values,
            errors,
        };
    }

    /**
     * Ejecuta una función sync y captura errores como Result.
     */
    public static execute<T>(fn: () => T): Result<T, LayeredError> {
        try {
            const value = fn();
            return Result.ok(value);
        } catch (error) {
            if (error instanceof LayeredError) {
                return Result.fail(error);
            }
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(new UnexpectedError('Result.execute', message));
        }
    }

    /**
     * Ejecuta una función async y captura errores como Result.
     */
    public static async executeAsync<T>(fn: () => Promise<T>): Promise<Result<T, LayeredError>> {
        try {
            const value = await fn();
            return Result.ok(value);
        } catch (error) {
            if (error instanceof LayeredError) {
                return Result.fail(error);
            }
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(new UnexpectedError('Result.executeAsync', message));
        }
    }

    public isSuccess(): this is Result<T, never> {
        return this._isSuccess;
    }

    public isFailure(): this is Result<never, E> {
        return !this._isSuccess;
    }

    get value(): T {
        if (!this._isSuccess) {
            throw new Error('Cannot access value of a failed Result. Check isSuccess() first.');
        }
        return this._value as T;
    }

    get error(): E {
        if (this._isSuccess) {
            throw new Error('Cannot access error of a successful Result. Check isFailure() first.');
        }
        return this._error as E;
    }
}

export interface CombinedResult {
    success: boolean;
    values: unknown[];
    errors: LayeredError[];
}
