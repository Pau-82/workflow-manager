import { MessageTemplate } from '../message-template.vo.js';
import { MESSAGE_TEMPLATE_ERRORS } from '../../errors/message-template.error.js';

describe('MessageTemplate', () => {
  describe('construcción', () => {
    it('acepta una plantilla con sintaxis válida', () => {
      const result = MessageTemplate.create('La métrica {{metrica}} llegó a {{valor}}');
      expect(result.isSuccess()).toBe(true);
    });

    it('rechaza una plantilla vacía', () => {
      const result = MessageTemplate.create('');
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(MESSAGE_TEMPLATE_ERRORS.EMPTY);
      }
    });

    it('rechaza una plantilla de más de 100 caracteres', () => {
      const result = MessageTemplate.create('x'.repeat(101));
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(MESSAGE_TEMPLATE_ERRORS.TOO_LONG);
      }
    });

    it('rechaza llaves {{ }} desbalanceadas', () => {
      const result = MessageTemplate.create('hola {{nombre');
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error.type).toBe(MESSAGE_TEMPLATE_ERRORS.UNBALANCED_SYNTAX);
      }
    });
  });

  describe('render', () => {
    it('sustituye las variables presentes', () => {
      const result = MessageTemplate.create('{{metrica}} = {{valor}}');
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.render({ metrica: 'cpu', valor: 95 })).toBe('cpu = 95');
      }
    });

    it('deja literal la variable que no se encuentra', () => {
      const result = MessageTemplate.create('{{metrica}} y {{inexistente}}');
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.render({ metrica: 'cpu' })).toBe('cpu y {{inexistente}}');
      }
    });
  });
});
