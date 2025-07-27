import { Types } from 'mongoose';

export interface IDetectionDisplayLog {
  id: Types.ObjectId;
}

export interface IDetectionDisplayLogProcessor {
  parameters: IDetectionDisplayLog;
}
