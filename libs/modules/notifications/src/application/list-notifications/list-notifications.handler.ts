import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger } from '@org/shared';
import type { Notification } from '../../domain/aggregate/notification.aggregate.js';
import {
  NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/ports/notification.repository.port.js';
import { NotificationMapper } from '../mappers/notification.mapper.js';
import { ListNotificationsError } from './errors/list-notifications.error.js';
import { CONTEXT } from './constants/list-notifications.constants.js';
import type { ListNotificationsOutput } from './interface/list-notifications.output.dto.js';

@Injectable()
export class ListNotificationsHandler {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: INotificationRepository,
    @Inject(LOGGER) private readonly logger: Logger,
  ) {}

  async execute(): Promise<
    Result<ListNotificationsOutput, ListNotificationsError>
  > {

    const notification = await this.fetchNotifications();
    if (notification.isFailure()) {
      return Result.fail<ListNotificationsOutput, ListNotificationsError>(
        notification.error,
      );
    }

    return Result.ok<ListNotificationsOutput, ListNotificationsError>(
      this.presentNotifications(notification.value),
    );
  }


  private async fetchNotifications(): Promise<
    Result<Notification[], ListNotificationsError>
  > {
    this.logger.log('Listing notifications', CONTEXT);

    const result = await Result.executeAsync(() => this.repository.list());
    if (result.isFailure()) {
      const error = ListNotificationsError.persistenceFailed(result.error.reason);

      return Result.fail<Notification[], ListNotificationsError>(error);
    }

    return Result.ok<Notification[], ListNotificationsError>(result.value);
  }

  private presentNotifications(
    notifications: Notification[],
  ): ListNotificationsOutput {
    const items = notifications.map((notification) =>
      NotificationMapper.toDto(notification),
    );

    this.logger.log('Notifications listed', CONTEXT, { count: items.length });

    return { items };
  }
}
