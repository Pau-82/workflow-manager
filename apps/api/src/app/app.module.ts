import { Module } from '@nestjs/common';
import { CreateWorkflowModule, GetWorkflowModule } from '@org/workflows';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcService } from '../trpc/trpc.service';

@Module({
  imports: [CreateWorkflowModule, GetWorkflowModule],
  controllers: [AppController],
  providers: [AppService, TrpcService],
  exports: [TrpcService],
})
export class AppModule {}
