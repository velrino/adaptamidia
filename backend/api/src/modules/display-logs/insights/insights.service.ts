import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GoogleGenAiProvider } from 'src/shared/google/llm/llm.service';
import { GoogleGenAiModelsEnum as Models } from 'src/shared/google/llm/llm.interface';
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
import { ApiError } from '@google/genai';

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

    return new Observable((subscriber) => {
      const abort = new AbortController();
      void (async () => {
        try {
          const { text, model } = await this.generateInsight(
            prompt,
            String(record._id),
            parameters.model ?? Models.DEFAULT,
            (chunk) => subscriber.next({ data: chunk }),
            abort.signal,
          );
          if (abort.signal.aborted) return;

          await this.getDisplayLogService.displayLogModel.updateOne(
            { _id: record._id },
            {
              llm_insight: text,
              llm_insight_model: model,
              llm_insight_at: new Date(),
            },
          );

          subscriber.next({ type: 'insight-model', data: model });
          subscriber.next({ data: '[DONE]' });
          subscriber.complete();
        } catch (error) {
          if (!abort.signal.aborted) {
            this.logGenerationFailure(String(record._id), error);
            subscriber.next({
              type: 'insight-error',
              data: 'Não foi possível gerar o insight. Tente novamente.',
            });
            subscriber.complete();
          }
        }
      })();
      return () => abort.abort();
    });
  }

  private async generateInsight(
    prompt: string,
    recordId: string,
    selection: Models,
    onChunk?: (text: string) => void,
    signal?: AbortSignal,
  ) {
    const useDefault =
      selection === Models.DEFAULT || selection === Models.GEMINI_2_0_FLASH_001;
    const models = useDefault
      ? [selection, Models.GEMINI_3_5_FLASH, Models.GEMINI_3_8_FLASH]
      : [selection];
    const seen = new Set<string>();
    let lastError: unknown;

    for (const candidate of models) {
      const model = this.aiProvider.resolveModel(candidate);
      if (seen.has(model)) continue;
      seen.add(model);

      let text = '';
      try {
        for await (const chunk of this.aiProvider.generateContent(
          prompt,
          candidate,
          { recordId, stream: Boolean(onChunk), signal },
        )) {
          text += chunk;
          onChunk?.(chunk);
        }
        if (!text.trim())
          throw new Error('The model returned no insight text.');
        return { text, model };
      } catch (error) {
        const retryable =
          error instanceof ApiError &&
          [404, 429, 502, 503, 504].includes(error.status);
        if (!useDefault || text || signal?.aborted || !retryable) throw error;
        lastError = error;
        Log(
          LogType.INFO,
          InsightDisplayLogService.name,
          'model',
          LogAction.SKIP,
          {
            recordId,
            model,
            status: error.status,
          },
        );
      }
    }
    throw lastError ?? new Error('No insight model is configured.');
  }

  private logGenerationFailure(recordId: string, error: unknown) {
    Log(
      LogType.ERROR,
      InsightDisplayLogService.name,
      'generate',
      LogAction.FAILED,
      {
        recordId,
        status: error instanceof ApiError ? error.status : undefined,
        errorType: error instanceof Error ? error.name : undefined,
      },
    );
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

      const { text, model } = await this.generateInsight(
        ShortOohPrompt(record),
        String(recordId),
        Models.DEFAULT,
      );

      await this.getDisplayLogService.displayLogModel.updateOne(
        {
          _id: recordId,
        },
        {
          $set: {
            llm_insight: text,
            llm_insight_model: model,
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
      this.logGenerationFailure(String(recordId), error);
    }
  }
}
