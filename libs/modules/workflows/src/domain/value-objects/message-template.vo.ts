import { Result, StringValueObject, type LayeredError } from '@org/shared';
import { MessageTemplateError } from '../errors/message-template.error.js';

const MAX_LENGTH = 100;

/** Valores a interpolar en el render. */
export type RenderValues = Record<string, string | number>;

/**
 * Plantilla de mensaje con `{{variables}}`. Valida solo la sintaxis de llaves
 * balanceadas en construcción; permisiva con qué variables se usan.
 */
export class MessageTemplate extends StringValueObject {
  //#region construction
  private constructor(value: string) {
    super(value);
  }

  static create(raw: string): Result<MessageTemplate, LayeredError> {
    const sanitized = MessageTemplate.sanitize(raw);
    const error = MessageTemplate.validate(sanitized);
    if (error) {
      return Result.fail<MessageTemplate>(error);
    }
    return Result.ok(new MessageTemplate(sanitized));
  }

  private static sanitize(raw: string): string {
    return raw ?? '';
  }

  private static validate(value: string): LayeredError | null {
    if (value.length === 0) {
      return MessageTemplateError.empty();
    }
    if (value.length > MAX_LENGTH) {
      return MessageTemplateError.tooLong(MAX_LENGTH);
    }
    if (!MessageTemplate.placeholdersAreBalanced(value)) {
      return MessageTemplateError.unbalancedSyntax();
    }
    return null;
  }

  /** `{{` y `}}` deben aparearse, sin anidar ni cierres huérfanos. */
  private static placeholdersAreBalanced(raw: string): boolean {
    let open = false;
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === '{' && raw[i + 1] === '{') {
        if (open) return false;
        open = true;
        i++;
      } else if (raw[i] === '}' && raw[i + 1] === '}') {
        if (!open) return false;
        open = false;
        i++;
      }
    }
    return !open;
  }
  //#endregion

  //#region behavior
  /** Sustituye las `{{var}}`; variable no encontrada se deja literal. */
  render(values: RenderValues): string {
    return this.value.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
      const replacement = values[key];
      return replacement === undefined ? match : String(replacement);
    });
  }
  //#endregion

  //#region accessors
  get raw(): string {
    return this.value;
  }
  //#endregion
}
