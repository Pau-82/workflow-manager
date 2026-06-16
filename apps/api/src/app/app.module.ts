import { Module } from '@nestjs/common';
import { CreateWorkflowModule } from '@org/workflows';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcService } from '../trpc/trpc.service';

@Module({
  imports: [CreateWorkflowModule],
  controllers: [AppController],
  providers: [AppService, TrpcService],
  exports: [TrpcService],
})
export class AppModule {}
