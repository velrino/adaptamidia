export enum LogType {
  INFO = 'info',
  LOG = 'log',
  ERROR = 'error',
}

export enum LogAction {
  SUCCESS = 'success',
  STARTED = 'started',
  EMPTY = 'empty',
  SKIP = 'skip',
  FAILED = 'failed',
  PROGRESS = 'progress',
}

export function Log(
  type: LogType,
  name: string,
  event: string,
  action: string,
  parameters: any,
) {
  console[type](`${type.toUpperCase()}.${name}.${event}.${action}`, parameters);
}
