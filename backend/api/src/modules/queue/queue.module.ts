import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { QueuesEnum } from './queue.interface';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: QueuesEnum.DISPLAY_LOG_CREATE,
    }),
    BullModule.registerQueue({
      name: QueuesEnum.DISPLAY_LOG_DETECT_IMAGE,
    }),
    BullModule.registerQueue({
      name: QueuesEnum.DISPLAY_LOG_INSIGHT,
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
