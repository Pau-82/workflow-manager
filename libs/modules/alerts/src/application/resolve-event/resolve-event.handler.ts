import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger, type LayeredError } from '@org/shared';
import type { AlertEvent } from '../../domain/aggregate/alert-event.aggregate.js';
import {
  ALERT_EVENT_REPOSITORY,
  type IAlertEventRepository,
} from '../../domain/ports/alert-event.repository.port.js';
import { RESOLUTION_ERRORS } from '../../domain/errors/resolution.error.js';
import { AlertEventMapper } from '../mappers/alert-event.mapper.js';
import { ResolveEventError } from './errors/resolve-event.error.js';
import { CONTEXT } from './constants/resolve-event.constants.js';
import type { ResolveEventInput } from './interface/resolve-event.input.dto.js';
import type { ResolveEventOutput } from './interface/resolve-event.output.dto.js';

@Injectable()
export class ResolveEventHandler {
  constructor(
    @Inject(ALERT_EVENT_REPOSITORY)
    private readonly repository: IAlertEventRepository,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(
    input: ResolveEventInput,
  ): Promise<Result<ResolveEventOutput, ResolveEventError>> {

    const result = await this.fetchEvent(input.eventId);
    if (result.isFailure()) {
      return Result.fail<ResolveEventOutput, ResolveEventError>(result.error);
    }

    const event = result.value;
    const transition = this.resolveEvent(event, input.note);
    if (transition.isFailure()) {
      return Result.fail<ResolveEventOutput, ResolveEventError>(transition.error);
    }

    const persistence = await this.persistEvent(event);
    if (persistence.isFailure()) {
      return Result.fail<ResolveEventOutput, ResolveEventError>(
        persistence.error,
      );
    }

    return Result.ok<ResolveEventOutput, ResolveEventError>(
      this.presentEvent(event),
    );
  }


  private async fetchEvent(
    eventId: string,
  ): Promise<Result<AlertEvent, ResolveEventError>> {
    this.logger.log('Resolving event', CONTEXT, { eventId });

    const result = await this.repository.getById(eventId);
    if (result.isFailure()) {
      const error = ResolveEventError.notFound(
        result.error.reason,
        result.error.metadata,
      );

      return Result.fail<AlertEvent, ResolveEventError>(error);
    }

    return Result.ok<AlertEvent, ResolveEventError>(result.value);
  }

  private resolveEvent(
    event: AlertEvent,
    note: string | null | undefined,
  ): Result<void, ResolveEventError> {
    const result = event.resolve(note);

    if (result.isFailure()) {
      return Result.fail<void, ResolveEventError>(this.toResolveError(result.error));
    }

    return Result.ok<void, ResolveEventError>(undefined);
  }

  /** Traduce el error de dominio (Resolution) al error del caso de uso. */
  private toResolveError(error: LayeredError): ResolveEventError {
    if (error.type === RESOLUTION_ERRORS.ALREADY_RESOLVED) {
      return ResolveEventError.alreadyResolved(error.reason, error.metadata);
    }
    
    return ResolveEventError.invalidInput(error.reason, error.metadata);
  }

  private async persistEvent(
    event: AlertEvent,
  ): Promise<Result<void, ResolveEventError>> {
    const result = await Result.executeAsync(() =>
      this.repository.update(event),
    );

    if (result.isFailure()) {
      const error = ResolveEventError.persistenceFailed(result.error.reason);

      return Result.fail<void, ResolveEventError>(error);
    }

    return Result.ok<void, ResolveEventError>(undefined);
  }

  private presentEvent(event: AlertEvent): ResolveEventOutput {
    const output = AlertEventMapper.toDto(event);

    this.logger.log('Event resolved', CONTEXT, { event: output });

    return output;
  }
}
