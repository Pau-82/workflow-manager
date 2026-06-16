/** Input del caso de uso: el id del evento a resolver + nota opcional. */
export interface ResolveEventInput {
  eventId: string;
  note?: string | null;
}
