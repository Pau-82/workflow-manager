import { AlertEvent } from '../alert-event.aggregate.js';
import type { AlertEventPersistenceProps } from '../interface/alert-event.props.js';
import { ALERT_EVENT_ERRORS } from '../../errors/alert-event.error.js';

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

describe('AlertEvent', () => {
  describe('creación', () => {
    it('nace SIEMPRE abierto, con id generado y sin datos de resolución', () => {
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
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.status).toBe('abierto');
        expect(result.value.resolvedAt).toBeNull();
        expect(result.value.resolutionNote).toBeNull();
        expect(result.value.workflowId).toBe(VALID_WORKFLOW_ID);
        expect(result.value.id.length).toBeGreaterThan(0);
      }
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

  describe('reconstitución desde persistencia', () => {
    it('reconstituye un evento con contexto threshold', () => {
      const result = AlertEvent.fromPersistence(persistedThreshold());
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.id).toBe(VALID_ID);
        expect(result.value.status).toBe('abierto');
        expect(result.value.triggerContext.type).toBe('threshold');
        if (result.value.triggerContext.type === 'threshold') {
          expect(result.value.triggerContext.metricName).toBe('cpu');
          expect(result.value.triggerContext.observedValue).toBe(95);
        }
      }
    });

    it('reconstituye un evento resuelto con contexto variance', () => {
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
        expect(result.value.triggerContext.type).toBe('variance');
        if (result.value.triggerContext.type === 'variance') {
          expect(result.value.triggerContext.actualDeviation).toBe(-30);
          expect(result.value.triggerContext.direction).toBe('below');
        }
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
          ALERT_EVENT_ERRORS.INCONSISTENT_RESOLUTION,
        );
      }
    });

    it('rechaza un estado desconocido', () => {
      const result = AlertEvent.fromPersistence(
        persistedThreshold({ status: 'pausado' }),
      );
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(ALERT_EVENT_ERRORS.INVALID_STATUS);
      }
    });
  });
});
