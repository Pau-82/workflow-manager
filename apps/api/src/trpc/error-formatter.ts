import { TRPCError } from '@trpc/server';
import type { LayeredError } from '@org/shared';

/**
 * Traductor puro: LayeredError de dominio/aplicación → TRPCError, mapeando por
 * `type`/`layer`. NO loguea: el logging centralizado de errores vive en el
 * `onError` del adaptador tRPC (main.ts), que ve TODOS los errores una sola vez.
 */
export function toTRPCError(error: LayeredError): TRPCError {
  return new TRPCError({
    code: mapCode(error),
    message: error.reason,
    cause: error,
  });
}

function mapCode(error: LayeredError) {
  const type = error.type;
  if (type.includes('NOT_FOUND')) {
    return 'NOT_FOUND' as const;
  }
  if (
    type.includes('ALREADY_') ||
    type.includes('DUPLICATE') ||
    type.includes('CONFLICT')
  ) {
    return 'CONFLICT' as const;
  }
  if (error.layer === 'domain' || type.includes('INVALID_INPUT')) {
    return 'BAD_REQUEST' as const;
  }
  return 'INTERNAL_SERVER_ERROR' as const;
}
