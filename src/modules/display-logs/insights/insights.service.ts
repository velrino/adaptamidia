import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GoogleGenAiProvider } from 'src/shared/google/llm/llm.service';
import {
  AiStreamChunk,
  GoogleGenAiModelsEnum,
} from 'src/shared/google/llm/llm.interface';
import {
  IDisplayLogInsightExecute,
  InsightGenerateDisplayLogQueryDto,
} from './insights.interface';
import { GetDisplayLogService } from '../get/get.service';
import { AuthService } from 'src/modules/auth/auth.service';
import { ShortOohPrompt } from './short-prompt.interface';
import { Process, Processor } from '@nestjs/bull';
import { QueuesEnum } from 'src/modules/queue/queue.interface';
import { Job } from 'bullmq';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { QueueService } from 'src/modules/queue/queue.service';
import { Types } from 'mongoose';
import { GenerateContentResponse } from '@google/genai';

@Processor(QueuesEnum.DISPLAY_LOG_INSIGHT)
@Injectable()
export class InsightDisplayLogService {
  constructor(
    private readonly aiProvider: GoogleGenAiProvider,
    private readonly getDisplayLogService: GetDisplayLogService,
    private readonly displayLogService: GetDisplayLogService,
    private readonly authService: AuthService,
    private readonly queueService: QueueService,
  ) {}

  async generateStream(
    parameters: InsightGenerateDisplayLogQueryDto,
  ): Promise<Observable<MessageEvent>> {
    await this.authService.validateToken(parameters.token);

    const record = await this.getDisplayLogService.get({ _id: parameters.id });

    const prompt = ShortOohPrompt(record);

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

  @Process({ concurrency: 5 })
  async processJob(job: Job<IDisplayLogInsightExecute>) {
    try {
      await this.execute(job.data);
      await job.isCompleted();
    } catch (error) {
      Log(
        LogType.ERROR,
        InsightDisplayLogService.name,
        this.processJob.name,
        LogAction.FAILED,
        { error },
      );
      await job.remove();
      throw error;
    }
  }

  // async onApplicationBootstrap() {
  //   // await this.displayLogService.displayLogModel.updateMany({
  //   //   $unset: { processing_lock: 1, processing_instance: 1 },
  //   // });
  //   await this.processPendingRecordsBatch();
  // }

  // async processPendingRecordsBatch() {
  //   const BATCH_SIZE = 50;
  //   let processedCount = 0;

  //   try {
  //     // Cria um cursor para iterar eficientemente pelos registros
  //     const cursor = this.displayLogService.displayLogModel
  //       .find({
  //         yolo: { $exists: true, $ne: null },
  //         insightface: { $exists: true, $ne: null },
  //         llm_insight: null,
  //       })
  //       .select(['_id'])
  //       .cursor();

  //     let batch: any[] = [];

  //     for await (const record of cursor) {
  //       batch.push(record);

  //       // Quando o batch atingir o tamanho desejado, processa
  //       if (batch.length >= BATCH_SIZE) {
  //         await this.processBatch(batch);
  //         processedCount += batch.length;
  //         batch = []; // Reseta o batch

  //         console.log(`Registros processados: ${processedCount}`);
  //       }
  //     }

  //     // Processa os registros restantes no último batch
  //     if (batch.length > 0) {
  //       await this.processBatch(batch);
  //       processedCount += batch.length;
  //       console.log(`Processamento finalizado. Total: ${processedCount}`);
  //     }
  //   } catch (error) {
  //     console.error('Erro no processamento em batch:', error);
  //     throw error;
  //   }
  // }

  // async processBatch(batch: any[]) {
  //   const promises = batch.map((record) =>
  //     this.execute(record).catch((error) => {
  //       console.error(`Erro no registro ${record._id}:`, error);
  //       return null; // Continua mesmo com erro
  //     }),
  //   );

  //   await Promise.all(promises);
  // }

  async execute(parameters: IDisplayLogInsightExecute) {
    const recordId = new Types.ObjectId(parameters.id);
    try {
      const record = await this.getDisplayLogService.get({ _id: recordId });

      const prompt = ShortOohPrompt(record);
      let response: GenerateContentResponse | null = null;

      let currentModel: GoogleGenAiModelsEnum | null = null;
      const fallbackModels: GoogleGenAiModelsEnum[] = [
        GoogleGenAiModelsEnum.GEMINI_2_0_FLASH_001,
        GoogleGenAiModelsEnum.DEEPSEEK_R1_0528_MAAS,
        GoogleGenAiModelsEnum.META_LLAMA_4_MAVERICK_17B_128E_INSTRUCT_MAAS,
        GoogleGenAiModelsEnum.GEMINI_2_5_PRO,
      ];

      for (const model of fallbackModels) {
        try {
          response = await this.aiProvider.generateContent(prompt, model);
          currentModel = model;
          break; // sucesso, sai do loop
        } catch (error) {
          // opcional: logar para debug
          console.warn(`Model ${model} falhou:`, error);
        }
      }

      if (!response || !currentModel) {
        throw new Error('Nenhum modelo conseguiu gerar resposta.');
      }

      await this.getDisplayLogService.displayLogModel.updateOne(
        {
          _id: recordId,
        },
        {
          $set: {
            llm_insight: response.text,
            llm_insight_model: currentModel,
            llm_insight_at: new Date(),
          },
          $unset: { processing_lock: 1, processing_instance: 1 },
        },
      );
    } catch (error) {
      await this.getDisplayLogService.displayLogModel.updateOne(
        {
          _id: recordId,
        },
        {
          $unset: { processing_lock: 1, processing_instance: 1 },
        },
      );
      Log(
        LogType.ERROR,
        InsightDisplayLogService.name,
        this.execute.name,
        LogAction.FAILED,
        { error },
      );
    }
  }
}
