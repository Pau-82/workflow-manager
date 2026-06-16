import {
  TriggerCondition,
  type TriggerConditionInput,
} from '../trigger-condition.vo.js';
import { TRIGGER_CONDITION_ERRORS } from '../../errors/trigger-condition.error.js';

describe('TriggerCondition', () => {
  describe('threshold', () => {
    it('se construye y evalúa la comparación contra el valor observado', () => {
      const result = TriggerCondition.create({
        type: 'threshold',
        metricName: 'cpu',
        operator: '>',
        value: 90,
      });
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.evaluate(95)).toBe(true);
        expect(result.value.evaluate(50)).toBe(false);
      }
    });

    it('rechaza un nombre de métrica vacío', () => {
      const result = TriggerCondition.create({
        type: 'threshold',
        metricName: '   ',
        operator: '>',
        value: 1,
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(
          TRIGGER_CONDITION_ERRORS.EMPTY_METRIC_NAME,
        );
      }
    });

    it('rechaza un valor umbral no finito', () => {
      const result = TriggerCondition.create({
        type: 'threshold',
        metricName: 'cpu',
        operator: '>',
        value: Number.POSITIVE_INFINITY,
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(TRIGGER_CONDITION_ERRORS.VALUE_NOT_FINITE);
      }
    });
  });

  describe('variance', () => {
    it('dispara según la dirección (above sube, below baja, any cualquiera)', () => {
      const above = TriggerCondition.create({
        type: 'variance',
        baseValue: 100,
        deviationPercent: 10,
        direction: 'above',
      });
      const below = TriggerCondition.create({
        type: 'variance',
        baseValue: 100,
        deviationPercent: 10,
        direction: 'below',
      });
      if (above.isSuccess()) {
        expect(above.value.evaluate(110)).toBe(true);
        expect(above.value.evaluate(90)).toBe(false);
      }
      if (below.isSuccess()) {
        expect(below.value.evaluate(90)).toBe(true);
        expect(below.value.evaluate(110)).toBe(false);
      }
    });

    it('rechaza un valor base de cero (división por cero)', () => {
      const result = TriggerCondition.create({
        type: 'variance',
        baseValue: 0,
        deviationPercent: 10,
        direction: 'any',
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(TRIGGER_CONDITION_ERRORS.BASE_VALUE_ZERO);
      }
    });

    it('rechaza un porcentaje de desviación mayor a 500', () => {
      const result = TriggerCondition.create({
        type: 'variance',
        baseValue: 100,
        deviationPercent: 501,
        direction: 'any',
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(
          TRIGGER_CONDITION_ERRORS.DEVIATION_TOO_LARGE,
        );
      }
    });
  });

  it('rechaza un tipo de condición desconocido', () => {
    const result = TriggerCondition.create({
      type: 'weird',
    } as unknown as TriggerConditionInput);
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(TRIGGER_CONDITION_ERRORS.UNKNOWN_TYPE);
    }
  });
});
