import type { ErrorLayer } from '@org/shared';

export const CONTEXT = 'ListEventHistory';
export const LAYER: ErrorLayer = 'application';

/** Defaults y topes de paginación (offset). */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
