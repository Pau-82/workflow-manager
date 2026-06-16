import { Module } from '@nestjs/common';
import {
  ActivateWorkflowModule,
  CreateWorkflowModule,
  GetWorkflowModule,
  ListWorkflowsModule,
  UpdateWorkflowModule,
} from '@org/workflows';
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
  ],
  controllers: [AppController],
  providers: [AppService, TrpcService],
  exports: [TrpcService],
})
export class AppModule {}
