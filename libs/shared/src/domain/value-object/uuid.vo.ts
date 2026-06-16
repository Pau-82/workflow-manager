import { StringValueObject } from './string.vo.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Base para identificadores UUID. Las subclases concretas (p. ej. WorkflowId)
 * aportan su `create`/`generate` y su marca nominal. Solo valida el formato;
 * la generación vive en la subclase (puede usar la API de su runtime).
 */
export abstract class Uuid extends StringValueObject {
  protected constructor(value: string) {
    super(value);
  }

  static isValid(value: string): boolean {
    return UUID_REGEX.test(value);
  }
}
