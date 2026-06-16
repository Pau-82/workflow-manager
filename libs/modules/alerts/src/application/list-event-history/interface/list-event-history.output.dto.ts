import type { AlertEventDto } from '../../mappers/interface/alert-event.dto.js';

/** Output de ListEventHistory: página de eventos + metadatos de paginación. */
export interface ListEventHistoryOutput {
  items: AlertEventDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
