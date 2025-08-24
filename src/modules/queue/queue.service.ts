import { Injectable } from '@nestjs/common';
import { QueuesEnum } from './queue.interface';
import { InjectQueue } from '@nestjs/bull';
import Bull, { Queue } from 'bull';
import { Log, LogAction, LogType } from '../logs/log.helper';
import {
  ICreateDisplayLog,
  ICreateDisplayLogProcessor,
} from '../display-logs/create/create.interface';
import {
  IDetectionDisplayLog,
  IDetectionDisplayLogProcessor,
} from '../display-logs/detection/detection.interface';
import { IDisplayLogInsightExecute } from '../display-logs/insights/insights.interface';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QueuesEnum.DISPLAY_LOG_CREATE)
    readonly displayLogCreateQueue: Queue<ICreateDisplayLogProcessor>,
    @InjectQueue(QueuesEnum.DISPLAY_LOG_DETECT_IMAGE)
    readonly displayLogDetectImageQueueQueue: Queue<IDetectionDisplayLogProcessor>,
    @InjectQueue(QueuesEnum.DISPLAY_LOG_INSIGHT)
    readonly displayLogInsightQueue: Queue<IDisplayLogInsightExecute>,
  ) {}

  defaultQueueOptions: Bull.JobOptions = {
    // Automatically remove the job from the queue upon successful completion
    removeOnComplete: true,
    // Automatically remove the job from the queue upon failure
    removeOnFail: true,
    // Set the number of retry attempts to 3 in case of failure
    attempts: 2,
    // Define a fixed delay of 1 minute (60,000 milliseconds) between retry attempts
    backoff: {
      type: 'fixed',
      delay: 60000, // 1 minute in milliseconds
    },
  };

  async addDisplayLogCreateQueue(parameters: ICreateDisplayLog) {
    const currentEvent = this.addDisplayLogCreateQueue.name;

    return await this.displayLogCreateQueue
      .add({ parameters }, this.defaultQueueOptions)
      .then((result) => {
        Log(LogType.INFO, QueueService.name, currentEvent, LogAction.SUCCESS, {
          result: result.id,
        });
        return result;
      })
      .catch((error) => {
        Log(LogType.ERROR, QueueService.name, currentEvent, LogAction.FAILED, {
          error,
        });
        return error;
      });
  }

  async addQueueDetectImage(parameters: IDetectionDisplayLog) {
    const currentEvent = this.addQueueDetectImage.name;

    return await this.displayLogDetectImageQueueQueue
      .add({ parameters }, this.defaultQueueOptions)
      .then((result) => {
        Log(LogType.INFO, QueueService.name, currentEvent, LogAction.SUCCESS, {
          result: result.id,
        });
        return result;
      })
      .catch((error) => {
        Log(LogType.ERROR, QueueService.name, currentEvent, LogAction.FAILED, {
          error,
        });
        return error;
      });
  }

  async addQueueDisplayLogInsight(parameters: IDisplayLogInsightExecute) {
    const currentEvent = this.addQueueDisplayLogInsight.name;

    return await this.displayLogInsightQueue
      .add(parameters, this.defaultQueueOptions)
      .then((result) => {
        Log(LogType.INFO, QueueService.name, currentEvent, LogAction.SUCCESS, {
          result: result.id,
        });
        return result;
      })
      .catch((error) => {
        Log(LogType.ERROR, QueueService.name, currentEvent, LogAction.FAILED, {
          error,
        });
        return error;
      });
  }
}
