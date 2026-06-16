/**
 * Helper de exhaustividad para uniones discriminadas.
 * En el `default` de un `switch` sobre el discriminante: si se agrega una
 * variante y falta su `case`, TypeScript falla en compilación (el argumento
 * dejaría de ser `never`). Red de seguridad de los switch exhaustivos del dominio.
 */
export function assertNever(value: never): never {
  throw new Error(
    `Unhandled case in exhaustive switch: ${JSON.stringify(value)}`,
  );
}
