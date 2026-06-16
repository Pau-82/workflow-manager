import {
  TriggerContext,
  type TriggerContextInput,
} from '../trigger-context/trigger-context.vo.js';
import { TRIGGER_CONTEXT_ERRORS } from '../../errors/trigger-context.error.js';

describe('TriggerContext', () => {
  describe('threshold', () => {
    it('se construye y expone los campos preservando el discriminante', () => {
      const result = TriggerContext.create({
        type: 'threshold',
        metricName: 'cpu',
        operator: '>',
        threshold: 90,
        observedValue: 97,
      });
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess() && result.value.type === 'threshold') {
        expect(result.value.metricName).toBe('cpu');
        expect(result.value.operator).toBe('>');
        expect(result.value.threshold).toBe(90);
        expect(result.value.observedValue).toBe(97);
      }
    });

    it('rechaza un nombre de métrica vacío', () => {
      const result = TriggerContext.create({
        type: 'threshold',
        metricName: '   ',
        operator: '>',
        threshold: 90,
        observedValue: 97,
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(
          TRIGGER_CONTEXT_ERRORS.EMPTY_METRIC_NAME,
        );
      }
    });

    it('rechaza un valor observado no finito', () => {
      const result = TriggerContext.create({
        type: 'threshold',
        metricName: 'cpu',
        operator: '>',
        threshold: 90,
        observedValue: Number.POSITIVE_INFINITY,
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(
          TRIGGER_CONTEXT_ERRORS.OBSERVED_VALUE_NOT_FINITE,
        );
      }
    });
  });

  describe('variance', () => {
    it('se construye y expone los campos preservando el discriminante', () => {
      const result = TriggerContext.create({
        type: 'variance',
        baseValue: 1000,
        deviationPercent: 20,
        direction: 'below',
        observedValue: 700,
        actualDeviation: -30,
      });
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess() && result.value.type === 'variance') {
        expect(result.value.baseValue).toBe(1000);
        expect(result.value.deviationPercent).toBe(20);
        expect(result.value.direction).toBe('below');
        expect(result.value.observedValue).toBe(700);
        expect(result.value.actualDeviation).toBe(-30);
      }
    });

    it('rechaza una dirección inválida', () => {
      const result = TriggerContext.create({
        type: 'variance',
        baseValue: 1000,
        deviationPercent: 20,
        direction: 'sideways',
        observedValue: 700,
        actualDeviation: -30,
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(
          TRIGGER_CONTEXT_ERRORS.INVALID_DIRECTION,
        );
      }
    });
  });

  it('rechaza un tipo de contexto desconocido', () => {
    const result = TriggerContext.create({
      type: 'weird',
    } as unknown as TriggerContextInput);
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(TRIGGER_CONTEXT_ERRORS.UNKNOWN_TYPE);
    }
  });
});
