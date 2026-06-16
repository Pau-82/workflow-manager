import { z } from 'zod';

/** Input para resolver un evento: id + nota opcional (máx 300, se deja al resolver). */
export const resolveEventSchema = z.object({
  eventId: z.string().min(1),
  note: z.string().trim().max(300).optional(),
});

export type ResolveEventInput = z.infer<typeof resolveEventSchema>;
