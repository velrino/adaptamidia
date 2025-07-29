import {
  Body,
  Controller,
  Post,
  Req,
  Sse,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthenticatedRequest, CustomRequest } from 'src/shared/request';
import { CreateDisplayLogService } from './create/create.service';
import { ICreateDisplayLogDto } from './create/create.interface';
import { ListDisplayLogService } from './list/list.service';
import { ListDisplayLogsPaginateDto } from './list/list.interface';
import { AuthJwtGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { DetectionDisplayLogService } from './detection/detection.service';
import { IDetectionDisplayLogDto } from './detection/detection.interface';
import { Observable } from 'rxjs';
import { GoogleGenAiProvider } from 'src/shared/google/llm/llm.service';
import { GoogleGenAiModelsEnum } from 'src/shared/google/llm/llm.interface';

@Controller()
export class DisplayLogController {
  constructor(
    private readonly createDisplayLogService: CreateDisplayLogService,
    private readonly listDisplayLogService: ListDisplayLogService,
    private readonly detectionDisplayLogService: DetectionDisplayLogService,
    private readonly aiProvider: GoogleGenAiProvider,
  ) {}

  @Post('display/logs/paginate')
  @SkipThrottle()
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  paginate(
    @Req() req: AuthenticatedRequest,
    @Body() body: ListDisplayLogsPaginateDto,
  ) {
    return this.listDisplayLogService.executeFromRequest(req, body);
  }

  @Post('display/log')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  createLog(@Req() req: CustomRequest, @Body() body: ICreateDisplayLogDto) {
    return this.createDisplayLogService.executeFromGuestRequest(req, body);
  }

  @Post('display/log/detect')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  detectDisplayLog(
    @Req() req: AuthenticatedRequest,
    @Body() body: IDetectionDisplayLogDto,
  ) {
    return this.detectionDisplayLogService.executeFromAuthenticatedRequest(
      req,
      body,
    );
  }

  @Sse('display/generate-stream')
  async generateStream(
    @Query('prompt') prompt: string,
  ): Promise<Observable<MessageEvent>> {
    const stream = this.aiProvider.generateContentStream(
      prompt,
      GoogleGenAiModelsEnum.GEMINI_2_0_FLASH_001,
    );

    // Usaremos um Observable para gerenciar o stream de forma reativa
    return new Observable((subscriber) => {
      // Função auto-executável para consumir o gerador assíncrono
      void (async () => {
        let fullText = '';
        try {
          for await (const chunk of stream) {
            fullText += chunk.text;
            // Envia o chunk para o cliente no formato de MessageEvent
            subscriber.next({ data: chunk.text } as MessageEvent);
          }

          console.log({ fullText });

          // ==============================================================================
          // AQUI: Após o stream ser concluído, você pode pegar o texto completo e salvar no MongoDB.
          // A variável 'fullText' contém toda a resposta gerada.
          //
          // Exemplo:
          // await this.myMongoDbService.save({
          //   prompt: prompt,
          //   response: fullText,
          //   createdAt: new Date(),
          // });
          // ==============================================================================

          // Sinaliza para o cliente que o stream terminou
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
