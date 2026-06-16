import { AlertEvent } from '../alert-event.aggregate.js';
import type { AlertEventPersistenceProps } from '../interface/alert-event.props.js';
import { ALERT_EVENT_ERRORS } from '../../errors/alert-event.error.js';
import { RESOLUTION_ERRORS } from '../../errors/resolution.error.js';

const VALID_ID = '33333333-3333-4333-8333-333333333333';
const VALID_WORKFLOW_ID = '11111111-1111-4111-8111-111111111111';

function persistedThreshold(
  overrides: Partial<AlertEventPersistenceProps> = {},
): AlertEventPersistenceProps {
  return {
    id: VALID_ID,
    workflowId: VALID_WORKFLOW_ID,
    triggeredAt: new Date('2026-06-01T08:00:00Z'),
    triggerContext: {
      type: 'threshold',
      metricName: 'cpu',
      operator: '>',
      threshold: 90,
      observedValue: 95,
    },
    renderedMessage: 'CPU al 95%',
    status: 'abierto',
    resolvedAt: null,
    resolutionNote: null,
    ...overrides,
  };
}

function anOpenEvent(): AlertEvent {
  const result = AlertEvent.create({
    workflowId: VALID_WORKFLOW_ID,
    triggerContext: {
      type: 'threshold',
      metricName: 'cpu',
      operator: '>',
      threshold: 90,
      observedValue: 99,
    },
    renderedMessage: 'CPU al 99%',
  });
  if (result.isFailure()) {
    throw new Error('fixture inválido');
  }
  return result.value;
}

describe('AlertEvent', () => {
  describe('creación', () => {
    it('nace SIEMPRE abierto, con id generado y sin datos de resolución', () => {
      const event = anOpenEvent();
      expect(event.status).toBe('abierto');
      expect(event.resolvedAt).toBeNull();
      expect(event.resolutionNote).toBeNull();
      expect(event.workflowId).toBe(VALID_WORKFLOW_ID);
      expect(event.id.length).toBeGreaterThan(0);
    });

    it('rechaza un mensaje renderizado vacío', () => {
      const result = AlertEvent.create({
        workflowId: VALID_WORKFLOW_ID,
        triggerContext: {
          type: 'threshold',
          metricName: 'cpu',
          operator: '>',
          threshold: 90,
          observedValue: 99,
        },
        renderedMessage: '   ',
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(
          ALERT_EVENT_ERRORS.EMPTY_RENDERED_MESSAGE,
        );
      }
    });
  });

  describe('resolución', () => {
    it('resuelve un evento abierto: pasa a resuelto, con fecha y nota normalizada', () => {
      const event = anOpenEvent();

      const result = event.resolve('  Escalado y normalizado  ');

      expect(result.isSuccess()).toBe(true);
      expect(event.status).toBe('resuelto');
      expect(event.resolvedAt).toBeInstanceOf(Date);
      expect(event.resolutionNote).toBe('Escalado y normalizado');
    });

    it('resolver dos veces falla con alreadyResolved (y no cambia el estado)', () => {
      const event = anOpenEvent();
      event.resolve('primera');

      const result = event.resolve('segunda');

      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(RESOLUTION_ERRORS.ALREADY_RESOLVED);
      }
      expect(event.resolutionNote).toBe('primera');
    });
  });

  describe('reconstitución desde persistencia', () => {
    it('reconstituye un evento abierto con contexto threshold', () => {
      const result = AlertEvent.fromPersistence(persistedThreshold());
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.id).toBe(VALID_ID);
        expect(result.value.status).toBe('abierto');
        expect(result.value.triggerContext.type).toBe('threshold');
        if (result.value.triggerContext.type === 'threshold') {
          expect(result.value.triggerContext.observedValue).toBe(95);
        }
      }
    });

    it('reconstituye un evento resuelto (con fecha y nota) con contexto variance', () => {
      const result = AlertEvent.fromPersistence(
        persistedThreshold({
          status: 'resuelto',
          resolvedAt: new Date('2026-06-03T18:00:00Z'),
          resolutionNote: 'Promoción lanzada.',
          triggerContext: {
            type: 'variance',
            baseValue: 1000,
            deviationPercent: 20,
            direction: 'below',
            observedValue: 700,
            actualDeviation: -30,
          },
          renderedMessage: 'Ventas cayeron 30%',
        }),
      );
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.status).toBe('resuelto');
        expect(result.value.resolvedAt).not.toBeNull();
        expect(result.value.resolutionNote).toBe('Promoción lanzada.');
        expect(result.value.triggerContext.type).toBe('variance');
      }
    });

    it('rechaza un id que no es UUID válido (base corrupta)', () => {
      const result = AlertEvent.fromPersistence(
        persistedThreshold({ id: 'no-es-uuid' }),
      );
      expect(result.isFailure()).toBe(true);
    });

    it('rechaza un estado resuelto sin fecha de resolución (incoherente)', () => {
      const result = AlertEvent.fromPersistence(
        persistedThreshold({ status: 'resuelto', resolvedAt: null }),
      );
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(
          RESOLUTION_ERRORS.RESOLVED_WITHOUT_DATE,
        );
      }
    });

    it('rechaza un estado desconocido', () => {
      const result = AlertEvent.fromPersistence(
        persistedThreshold({ status: 'pausado' }),
      );
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(RESOLUTION_ERRORS.INVALID_STATUS);
      }
    });
  });
});
