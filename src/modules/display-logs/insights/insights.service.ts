import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GoogleGenAiProvider } from 'src/shared/google/llm/llm.service';
import { GoogleGenAiModelsEnum } from 'src/shared/google/llm/llm.interface';

@Injectable()
export class InsightDisplayLogService {
  constructor(private readonly aiProvider: GoogleGenAiProvider) {}

  generateStream(prompt: string): Observable<MessageEvent> {
    const stream = this.aiProvider.generateContentStream(
      prompt,
      GoogleGenAiModelsEnum.GEMINI_2_0_FLASH_001,
    );

    return new Observable((subscriber) => {
      void (async () => {
        let fullText = '';
        try {
          for await (const chunk of stream) {
            fullText += chunk.text;
            subscriber.next({ data: chunk.text } as MessageEvent);
          }

          console.log({ fullText });

          // ==============================================================================
          // AQUI: Ap�s o stream ser conclu�do, voc� pode pegar o texto completo e salvar no MongoDB.
          // A vari�vel 'fullText' cont�m toda a resposta gerada.
          //
          // Exemplo:
          // await this.myMongoDbService.save({
          //   prompt: prompt,
          //   response: fullText,
          //   createdAt: new Date(),
          // });
          // ==============================================================================

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
