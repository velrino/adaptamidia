import {
  Injectable,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import {
  // IApiDeepFaceAnalysisResult,
  IApiDetectInsightface,
  IApiYoloResult,
} from './detection.interface';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';

@Injectable()
export class DetectionService implements OnModuleInit {
  private readonly baseUrl =
    process.env.DETECTION_API_URL || 'http://localhost:8000';

  async onModuleInit() {
    if (!process.env.DETECTION_API_URL) return;

    try {
      const response = await this.check();
      Log(
        LogType.INFO,
        DetectionService.name,
        this.onModuleInit.name,
        LogAction.STARTED,
        { response },
      );
    } catch (error) {
      Log(
        LogType.ERROR,
        DetectionService.name,
        this.onModuleInit.name,
        LogAction.FAILED,
        { error },
      );
    }
  }

  async check() {
    return this.makeRequest<any>('GET', '/');
  }

  // Função reutilizável para requests com fetch
  private async makeRequest<T>(
    method: 'GET' | 'POST' = 'POST',
    endpoint: string,
    file?: Express.Multer.File,
    timeout: number = 30000,
    responseType: 'json' | 'buffer' = 'json',
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const fullUrl = `${this.baseUrl}${endpoint}`;

    try {
      // Log(
      //   LogType.INFO,
      //   DetectionService.name,
      //   this.makeRequest.name,
      //   LogAction.STARTED,
      //   {
      //     fullUrl,
      //     endpoint,
      //     method,
      //     ...(file?.originalname && { fileName: file.originalname }),
      //     ...(file?.size && { fileSize: file.size }),
      //     ...(file?.mimetype && { mimeType: file.mimetype }),
      //     ...(file?.buffer?.length && { bufferLength: file.buffer.length }),
      //   },
      // );

      let body: FormData | undefined;
      if (file && method === 'POST') {
        const formData = new FormData();
        const filename = file.originalname.split('/').pop() || 'image.jpg';
        const uint8Array = new Uint8Array(file.buffer);
        const blob = new Blob([uint8Array], { type: file.mimetype });
        formData.append('file', blob, filename);
        body = formData;
      }

      const response = await fetch(fullUrl, {
        method,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        Log(
          LogType.ERROR,
          DetectionService.name,
          this.makeRequest.name,
          LogAction.FAILED,
          {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            errorBody,
          },
        );
        throw new HttpException(
          `Erro request ${endpoint}: ${response.status} - ${errorBody}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Log(
      //   LogType.INFO,
      //   DetectionService.name,
      //   this.makeRequest.name,
      //   LogAction.SUCCESS,
      //   {
      //     endpoint,
      //     status: response.status,
      //     statusText: response.statusText,
      //   },
      // );

      // Liberar memória do buffer após o uso
      // if (file) {
      //   this.clearFileMemory(file);
      // }

      if (responseType === 'buffer') {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer) as T;
      } else {
        const data = await response.json();
        return data as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      // Liberar memória mesmo em caso de erro
      if (file) {
        this.clearFileMemory(file);
      }

      if (error.name === 'AbortError') {
        throw new HttpException(
          `Request timeout para ${endpoint}`,
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      throw new HttpException(
        `Erro ao fazer request para ${endpoint}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private clearFileMemory(file: Express.Multer.File): void {
    try {
      // Liberar buffer
      if (file.buffer) {
        file.buffer.fill(0);
        delete (file as any).buffer;
      }
      // Fechar stream se existir
      if (file.stream && typeof file.stream.destroy === 'function') {
        file.stream.destroy();
      }

      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      Log(
        LogType.ERROR,
        DetectionService.name,
        this.clearFileMemory.name,
        LogAction.FAILED,
        { error: error.message },
      );
    }
  }

  async detectYolo(file: Express.Multer.File): Promise<IApiYoloResult> {
    return await this.makeRequest<IApiYoloResult>(
      'POST',
      '/detect-yolo',
      file,
      30000, // 30 seconds timeout
    );
  }

  async detectPeopleBbox(file: Express.Multer.File): Promise<Buffer> {
    return await this.makeRequest<Buffer>(
      'POST',
      '/detect-people-bbox',
      file,
      30000, // 30 seconds timeout (imagem pode demorar mais)
      'buffer',
    );
  }

  async detectInsightface(
    file: Express.Multer.File,
  ): Promise<IApiDetectInsightface> {
    return await this.makeRequest<IApiDetectInsightface>(
      'POST',
      '/detect-insightface',
      file,
      30000, // 30 seconds timeout
    );
  }

  // async detectDeepFace(
  //   file: Express.Multer.File,
  // ): Promise<IApiDeepFaceAnalysisResult> {
  //   return await this.makeRequest<IApiDeepFaceAnalysisResult>(
  //     'POST',
  //     '/detect-deepface',
  //     file,
  //     30000, // 30 seconds timeout (análise facial pode ser mais demorada)
  //   );
  // }
}
