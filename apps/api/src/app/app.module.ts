import { Module } from '@nestjs/common';
import {
  ActivateWorkflowModule,
  CreateWorkflowModule,
  DeactivateWorkflowModule,
  GetWorkflowModule,
  ListWorkflowsModule,
  UpdateWorkflowModule,
} from '@org/workflows';
import { ListEventHistoryModule, ResolveEventModule } from '@org/alerts';
import { ListNotificationsModule } from '@org/notifications';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcService } from '../trpc/trpc.service';

@Module({
  imports: [
    CreateWorkflowModule,
    GetWorkflowModule,
    ListWorkflowsModule,
    UpdateWorkflowModule,
    ActivateWorkflowModule,
    DeactivateWorkflowModule,
    ListEventHistoryModule,
    ResolveEventModule,
    ListNotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, TrpcService],
  exports: [TrpcService],
})
export class AppModule {}
