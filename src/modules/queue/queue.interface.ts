export enum QueuesEnum {
  DISPLAY_LOG_CREATE = 'DISPLAY_LOG_CREATE',
  DISPLAY_LOG_INSIGHT = 'DISPLAY_LOG_INSIGHT',
  DISPLAY_LOG_DETECT_IMAGE = 'DISPLAY_LOG_DETECT_IMAGE',
}

export enum QueueStatus {
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  STARTED = 'STARTED',
}

export interface IQueueWasJobProcessed {
  name: QueuesEnum;
  status?: QueueStatus;
}

export interface IQueueProcessJobParams {
  name: QueuesEnum;
  execute: (...args: any[]) => Promise<any>;
  params?: any[];
  secondsAgo?: number;
}
