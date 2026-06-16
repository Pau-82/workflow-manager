import { Workflow } from '../workflow.aggregate.js';
import type { CreateWorkflowProps } from '../interface/workflow.props.js';
import { WORKFLOW_ERRORS } from '../../errors/workflow.error.js';
import { WORKFLOW_NAME_ERRORS } from '../../errors/workflow-name.error.js';

function validProps(
  overrides: Partial<CreateWorkflowProps> = {},
): CreateWorkflowProps {
  return {
    name: 'Alerta CPU',
    triggerCondition: {
      type: 'threshold',
      metricName: 'cpu',
      operator: '>',
      value: 90,
    },
    messageTemplate: 'La métrica {{metrica}} llegó a {{valor}}',
    recipients: [{ channel: 'in-app', target: 'soporte' }],
    ...overrides,
  };
}

describe('Workflow', () => {
  describe('creación', () => {
    it('crea un workflow válido que nace inactivo y con id generado', () => {
      const result = Workflow.create(validProps());
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.isActive).toBe(false);
        expect(result.value.name).toBe('Alerta CPU');
        expect(typeof result.value.id).toBe('string');
        expect(result.value.id.length).toBeGreaterThan(0);
      }
    });

    it('exige al menos un destinatario', () => {
      const result = Workflow.create(validProps({ recipients: [] }));
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(WORKFLOW_ERRORS.NO_RECIPIENTS);
      }
    });

    it('cuando hay varios datos inválidos, reúne todos los errores (no corta en el primero)', () => {
      const result = Workflow.create(
        validProps({ name: '', messageTemplate: '', recipients: [] }),
      );
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(WORKFLOW_ERRORS.INVALID_COMPOSITION);
        const nested = result.error.metadata?.['errors'] as unknown[];
        expect(nested.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('cuando hay un solo error, lo devuelve tal cual (sin envolver)', () => {
      const result = Workflow.create(validProps({ name: '' }));
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(WORKFLOW_NAME_ERRORS.EMPTY);
      }
    });
  });

  describe('comportamiento', () => {
    it('un workflow inactivo nunca dispara', () => {
      const result = Workflow.create(validProps());
      if (result.isSuccess()) {
        expect(result.value.shouldTrigger(999)).toBe(false);
      }
    });

    it('activo, delega la evaluación en su condición', () => {
      const result = Workflow.create(validProps());
      if (result.isSuccess()) {
        result.value.activate();
        expect(result.value.shouldTrigger(95)).toBe(true);
        expect(result.value.shouldTrigger(10)).toBe(false);
      }
    });

    it('renderiza el mensaje delegando en la plantilla', () => {
      const result = Workflow.create(validProps());
      if (result.isSuccess()) {
        expect(result.value.renderMessage({ metrica: 'cpu', valor: 95 })).toBe(
          'La métrica cpu llegó a 95',
        );
      }
    });

    it('captura el contexto del disparo delegando en la condición (Demeter)', () => {
      const result = Workflow.create(validProps());
      if (result.isSuccess()) {
        expect(result.value.captureTriggerContext(95)).toEqual({
          type: 'threshold',
          metricName: 'cpu',
          operator: '>',
          threshold: 90,
          observedValue: 95,
        });
      }
    });
  });

  describe('reconstitución desde persistencia', () => {
    const VALID_ID = '11111111-1111-4111-8111-111111111111';

    it('respeta el id y el estado activo persistidos', () => {
      const result = Workflow.fromPersistence({
        id: VALID_ID,
        isActive: true,
        ...validProps(),
      });
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.id).toBe(VALID_ID);
        expect(result.value.isActive).toBe(true);
      }
    });

    it('rechaza un id que no es un UUID válido (base corrupta)', () => {
      const result = Workflow.fromPersistence({
        id: 'no-es-uuid',
        isActive: true,
        ...validProps(),
      });
      expect(result.isFailure()).toBe(true);
    });
  });
});
