import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InsightGenerateDisplayLogQueryDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  // @IsOptional()
  // @IsString()
  // model?: string;
}
