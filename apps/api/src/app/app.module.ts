import { Module } from '@nestjs/common';
import {
  ActivateWorkflowModule,
  CreateWorkflowModule,
  DeactivateWorkflowModule,
  GetWorkflowModule,
  ListWorkflowsModule,
  UpdateWorkflowModule,
} from '@org/workflows';
import { ListEventHistoryModule } from '@org/alerts';
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
  ],
  controllers: [AppController],
  providers: [AppService, TrpcService],
  exports: [TrpcService],
})
export class AppModule {}
