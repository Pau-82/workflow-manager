import { WorkflowName } from '../workflow-name.vo.js';
import { WORKFLOW_NAME_ERRORS } from '../../errors/workflow-name.error.js';

describe('WorkflowName', () => {
  it('acepta un nombre válido y lo recorta', () => {
    const result = WorkflowName.create('  Alerta CPU  ');
    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.name).toBe('Alerta CPU');
    }
  });

  it('rechaza un nombre vacío o en blanco', () => {
    const result = WorkflowName.create('   ');
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(WORKFLOW_NAME_ERRORS.EMPTY);
    }
  });

  it('rechaza un nombre de más de 100 caracteres', () => {
    const result = WorkflowName.create('x'.repeat(101));
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.type).toBe(WORKFLOW_NAME_ERRORS.TOO_LONG);
    }
  });
});
