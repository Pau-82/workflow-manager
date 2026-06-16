/**
 * Resultado de simular un disparo:
 * - triggered=false: no estaba activo o la condición no se cumplió (no toca la base).
 * - triggered=true, duplicate=true: ya había un evento abierto (no se creó otro);
 *   `eventId` es el del evento existente (si se conoce).
 * - triggered=true, duplicate=false: se creó un evento nuevo (`eventId`) y se
 *   congeló `renderedMessage`.
 */
export interface SimulateTriggerOutput {
  triggered: boolean;
  duplicate: boolean;
  eventId?: string;
  renderedMessage?: string;
}
