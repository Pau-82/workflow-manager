import { z } from 'zod';

/** Estado de un evento de alerta. */
export const eventStatusSchema = z.enum(['abierto', 'resuelto']);

/**
 * Input del historial: filtros opcionales y combinables + paginación offset.
 * `page`/`limit` con defaults; `limit` topeado en 100 para no traer de más.
 */
export const listEventHistorySchema = z.object({
  workflowId: z.string().trim().uuid().optional(),
  status: eventStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListEventHistoryInput = z.infer<typeof listEventHistorySchema>;
