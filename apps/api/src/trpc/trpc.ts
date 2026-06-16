import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';

/** Contexto tRPC (sin auth en este scope). */
export type TrpcContext = Record<string, never>;

const t = initTRPC.context<TrpcContext>().create({
  // Da forma a los errores que salen al cliente. El caso especial es el de
  // validación de input (Zod): en vez de volcar el ZodError crudo como string,
  // expone los errores por campo en `data.zodError` y deja un message corto.
  // Los errores de dominio/aplicación ya llegan con un message limpio (vía el
  // error-formatter), así que para ellos se conserva el shape por defecto.
  errorFormatter({ shape, error }) {
    const zodError =
      error.cause instanceof ZodError ? error.cause.flatten() : null;
    return {
      ...shape,
      message: zodError ? 'Input validation failed' : shape.message,
      data: {
        ...shape.data,
        zodError,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
