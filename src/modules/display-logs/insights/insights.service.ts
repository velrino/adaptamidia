import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GoogleGenAiProvider } from 'src/shared/google/llm/llm.service';
import {
  AiStreamChunk,
  GoogleGenAiModelsEnum,
} from 'src/shared/google/llm/llm.interface';
import { InsightGenerateDisplayLogQueryDto } from './insights.interface';
import { GetDisplayLogService } from '../get/get.service';
import { GenerateOOHPrompt } from './prompt.interface';

@Injectable()
export class InsightDisplayLogService {
  constructor(
    private readonly aiProvider: GoogleGenAiProvider,
    private readonly getDisplayLogService: GetDisplayLogService,
  ) {}

  async generateStream(
    parameters: InsightGenerateDisplayLogQueryDto,
  ): Promise<Observable<MessageEvent>> {
    const record = await this.getDisplayLogService.get({ _id: parameters.id });

    const prompt = GenerateOOHPrompt(record);

    const getModel = parameters.model
      ? GoogleGenAiModelsEnum[parameters.model]
      : GoogleGenAiModelsEnum.GEMINI_2_0_FLASH_001;

    let currentModel: GoogleGenAiModelsEnum =
      getModel || GoogleGenAiModelsEnum.GEMINI_2_0_FLASH_001;

    let stream: AsyncGenerator<AiStreamChunk>;

    try {
      stream = this.aiProvider.generateContentStream(prompt, currentModel);
    } catch (error) {
      console.error(
        'Error with primary model, falling back to secondary:',
        error,
      );
      currentModel = GoogleGenAiModelsEnum.DEEPSEEK_R1_0528_MAAS;
      stream = this.aiProvider.generateContentStream(prompt, currentModel);
    }

    return new Observable((subscriber) => {
      void (async () => {
        let fullText = '';
        try {
          for await (const chunk of stream) {
            fullText += chunk.text;
            subscriber.next({ data: chunk.text } as MessageEvent);
          }

          await this.getDisplayLogService.displayLogModel.updateOne(
            {
              _id: record._id,
            },
            {
              llm_insight: fullText,
              llm_insight_model: currentModel,
              llm_insight_at: new Date(),
            },
          );

          subscriber.next({ data: '[DONE]' } as MessageEvent);
          subscriber.complete();
        } catch (error) {
          console.error('Erro no stream de IA:', error);
          subscriber.error(error);
        }
      })();
    });
  }
}
