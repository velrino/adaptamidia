import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';
import { IGoogleStorageBucket } from './google-cloud-storage.interface';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { readFile } from 'fs/promises';
import { Readable } from 'stream';

@Injectable()
export class GoogleCloudStorageService {
  private storage: Storage;

  constructor(private configService: ConfigService) {
    const keyFilename = join(
      process.cwd(),
      'resources',
      'rare-tape-466414-f4-a4a31231b9e1.json',
    );

    this.storage = new Storage({
      // projectId: 'rare-tape-466414-f4', //|| this.configService.get<string>('GCS_PROJECT_ID'),
      keyFilename,
    });
  }

  async onApplicationBootstrap() {
    try {
      const healt_check = await this.healthCheck();
      Log(
        LogType.INFO,
        GoogleCloudStorageService.name,
        this.onApplicationBootstrap.name,
        LogAction.SUCCESS,
        { healt_check },
      );
    } catch (error) {
      Log(
        LogType.ERROR,
        GoogleCloudStorageService.name,
        this.onApplicationBootstrap.name,
        LogAction.FAILED,
        { error },
      );
    }
  }

  async healthCheck() {
    const startTime = Date.now(); // Record the start time

    try {
      const filePath = join(
        process.cwd(),
        'resources',
        'example',
        'example.png',
      );
      const fileBuffer = await readFile(filePath);

      const stream = new Readable();
      stream.push(fileBuffer);
      stream.push(null);

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'example.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: fileBuffer.length,
        buffer: fileBuffer,
        stream: stream,
        destination: '',
        filename: '',
        path: '',
      };

      const folderName: string = 'example';
      const fileName: string = 'example.png';

      // Upload the file
      const uploadStartTime = Date.now();
      const uploadResult = await this.uploadFile(
        folderName,
        fileName,
        file,
        IGoogleStorageBucket.ADAPTA_MIDIA,
      );
      const uploadEndTime = Date.now();

      // Generate a signed URL
      const signedUrlStartTime = Date.now();
      const signedUrl = await this.getSignedUrl(
        uploadResult.path,
        IGoogleStorageBucket.ADAPTA_MIDIA,
      );
      const signedUrlEndTime = Date.now();

      // Delete the file
      const deleteStartTime = Date.now();
      // const deleteResult = await this.deleteFile(
      //   uploadResult.filePath,
      //   IGoogleStorageBucket.XMP_MIDIA,
      // );
      const deleteResult = {};
      const deleteEndTime = Date.now();

      const endTime = Date.now(); // Record the end time

      // Calculate durations
      const uploadDuration = uploadEndTime - uploadStartTime;
      const signedUrlDuration = signedUrlEndTime - signedUrlStartTime;
      const deleteDuration = deleteEndTime - deleteStartTime;
      const totalDuration = endTime - startTime;

      // Return the results with timings
      return {
        uploadResult,
        signedUrl,
        deleteResult,
        timings: {
          uploadDuration,
          signedUrlDuration,
          deleteDuration,
          totalDuration,
        },
      };
    } catch (error) {
      Log(
        LogType.ERROR,
        GoogleCloudStorageService.name,
        this.healthCheck.name,
        LogAction.FAILED,
        { error },
      );
      throw new InternalServerErrorException(
        RESULT.GOOGLE_STORAGE_HEALTH_CHECK_FAILED,
      );
    }
  }

  async uploadFile(
    folderName: string,
    fileName: string,
    file: Express.Multer.File,
    bucket: IGoogleStorageBucket,
    makePublic: boolean = false,
  ) {
    const filePath = `${folderName}/${fileName}`;
    const bucketRef = this.storage.bucket(bucket);
    const blob = bucketRef.file(filePath);

    try {
      const stream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
        },
      });

      stream.end(file.buffer);

      // Aguarda o término do upload
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // Define o arquivo como público (opcional)
      if (makePublic) {
        await blob.makePublic();
      }

      return {
        public_url: `https://storage.googleapis.com/${bucket}/${filePath}`,
        file_name: fileName,
        bucket: bucket,
        folder_name: folderName,
        path: filePath,
      };
    } catch (error) {
      Log(
        LogType.ERROR,
        GoogleCloudStorageService.name,
        this.uploadFile.name,
        LogAction.FAILED,
        { bucket, error },
      );
      throw new InternalServerErrorException(
        RESULT.GOOGLE_STORAGE_UPLOAD_FAILED,
      );
    }
  }

  async deleteFile(
    filename: string,
    bucket: IGoogleStorageBucket,
  ): Promise<void> {
    try {
      const bucketRef = this.storage.bucket(bucket);
      await bucketRef.file(filename).delete();
    } catch (error) {
      Log(
        LogType.ERROR,
        GoogleCloudStorageService.name,
        this.deleteFile.name,
        LogAction.FAILED,
        { filename, bucket, error },
      );
      throw new InternalServerErrorException(
        RESULT.GOOGLE_STORAGE_DELETE_FAILED,
      );
    }
  }

  async getSignedUrl(
    filename: string,
    bucket: IGoogleStorageBucket,
    isPublic: boolean = false, // Indica se o arquivo é público (opcional, padrão false)
    expiresInMs?: number, // Tempo de expiração em milissegundos (opcional)
  ): Promise<string> {
    try {
      const file = this.storage.bucket(bucket).file(filename);

      // Se o arquivo for público e a URL pública for solicitada, retorne a URL pública
      if (isPublic) {
        await file.makePublic(); // Garante que o arquivo seja público
        return `https://storage.googleapis.com/${bucket}/${filename}`;
      }

      // Caso contrário, gere uma URL assinada
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + (expiresInMs || 7 * 24 * 60 * 60 * 1000), // 7 dias por padrão
      });

      return url;
    } catch (error) {
      Log(
        LogType.ERROR,
        GoogleCloudStorageService.name,
        this.getSignedUrl.name,
        LogAction.FAILED,
        { filename, bucket, error },
      );
      throw new InternalServerErrorException(
        RESULT.GOOGLE_STORAGE_SIGNED_FAILED,
      );
    }
  }
}
