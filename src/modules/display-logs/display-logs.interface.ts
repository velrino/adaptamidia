import { IsString, IsNotEmpty } from 'class-validator';

export enum DisplayLogStatus {
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  DETECTION_YOLO = 'DETECTION_YOLO', //YOLO
  DETECTION_INSIGHTFACE = 'DETECTION_INSIGHTFACE', //INSIGHTFACE
  DETECTION_DEEPFACE = 'DETECTION_DEEPFACE', //DEEPFACE
}

export class IGenerateContentDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
