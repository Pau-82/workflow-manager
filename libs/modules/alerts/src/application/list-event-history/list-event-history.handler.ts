import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger } from '@org/shared';
import type { AlertEvent } from '../../domain/aggregate/alert-event.aggregate.js';
import {
  ALERT_EVENT_REPOSITORY,
  type EventHistoryFilters,
  type IAlertEventRepository,
} from '../../domain/ports/alert-event.repository.port.js';
import { AlertEventMapper } from '../mappers/alert-event.mapper.js';
import { ListEventHistoryError } from './errors/list-event-history.error.js';
import {
  CONTEXT,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from './constants/list-event-history.constants.js';
import type { ListEventHistoryInput } from './interface/list-event-history.input.dto.js';
import type { ListEventHistoryOutput } from './interface/list-event-history.output.dto.js';

/** Página de eventos + total, resuelta en una sola lectura del repositorio. */
interface EventPage {
  events: AlertEvent[];
  total: number;
}

@Injectable()
export class ListEventHistoryHandler {
  constructor(
    @Inject(ALERT_EVENT_REPOSITORY)
    private readonly repository: IAlertEventRepository,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(
    input: ListEventHistoryInput,
  ): Promise<Result<ListEventHistoryOutput, ListEventHistoryError>> {

    const { page, limit } = this.normalizePagination(input);
    const filters = this.extractFilters(input);

    const fetched = await this.fetchPage(filters, page, limit);
    if (fetched.isFailure()) {
      return Result.fail<ListEventHistoryOutput, ListEventHistoryError>(
        fetched.error,
      );
    }

    return Result.ok<ListEventHistoryOutput, ListEventHistoryError>(
      this.presentPage(fetched.value, page, limit),
    );
  }


  private normalizePagination(input: ListEventHistoryInput): {
    page: number;
    limit: number;
  } {
    const page =
      input.page && input.page > 0 ? Math.floor(input.page) : DEFAULT_PAGE;
    const requestedLimit =
      input.limit && input.limit > 0 ? Math.floor(input.limit) : DEFAULT_LIMIT;
    const limit = Math.min(requestedLimit, MAX_LIMIT);

    return { page, limit };
  }

  private extractFilters(input: ListEventHistoryInput): EventHistoryFilters {
    return { workflowId: input.workflowId, status: input.status };
  }

  private async fetchPage(
    filters: EventHistoryFilters,
    page: number,
    limit: number,
  ): Promise<Result<EventPage, ListEventHistoryError>> {
    this.logger.log('Listing event history', CONTEXT, { filters, page, limit });

    const offset = (page - 1) * limit;
    const result = await Result.executeAsync<EventPage>(async () => {
      const [events, total] = await Promise.all([
        this.repository.history({ ...filters, offset, limit }),
        this.repository.count(filters),
      ]);
      
      return { events, total };
    });

    if (result.isFailure()) {
      const error = ListEventHistoryError.persistenceFailed(result.error.reason);

      return Result.fail<EventPage, ListEventHistoryError>(error);
    }

    return Result.ok<EventPage, ListEventHistoryError>(result.value);
  }

  private presentPage(
    page: EventPage,
    pageNumber: number,
    limit: number,
  ): ListEventHistoryOutput {
    const items = page.events.map((event) => AlertEventMapper.toDto(event));
    const totalPages = page.total === 0 ? 0 : Math.ceil(page.total / limit);

    this.logger.log('Event history listed', CONTEXT, {
      count: items.length,
      total: page.total,
      page: pageNumber,
      limit,
      totalPages,
    });

    return {
      items,
      total: page.total,
      page: pageNumber,
      limit,
      totalPages,
    };
  }
}
