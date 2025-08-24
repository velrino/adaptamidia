import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GoogleGenAiModelsEnum } from 'src/shared/google/llm/llm.interface';

export class InsightGenerateDisplayLogQueryDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsEnum(GoogleGenAiModelsEnum)
  model?: GoogleGenAiModelsEnum;
}

export interface IDisplayLogInsightExecute {
  id: string;
}
