import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Files } from '../files.schema';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { createHash } from 'crypto';
import { AuthenticatedRequest } from 'src/shared/request';
import { GetUserCompany, MIME_TO_EXTENSION } from 'src/shared/general';
import { IUploadFile, UploadFileDto } from './upload.interface';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawn, spawnSync } from 'child_process';

@Injectable()
export class UploadFileService {
  constructor(
    @InjectModel(Files.name) public model: Model<Files>,
    private googleCloudStorageService: GoogleCloudStorageService,
  ) {}

  private ffmpegChecked = false;
  private ffmpegPathResolved: string | null = null;

  private resolveFfmpegPath(): string | null {
    if (this.ffmpegChecked) return this.ffmpegPathResolved;

    // 1) Env var override
    const fromEnv = process.env.FFMPEG_PATH;
    if (fromEnv) {
      this.ffmpegChecked = true;
      this.ffmpegPathResolved = fromEnv;
      return this.ffmpegPathResolved;
    }

    // 1.5) Try ffmpeg-static if installed
    try {
      const ffmpegStatic = require('ffmpeg-static');
      if (ffmpegStatic) {
        const test = spawnSync(ffmpegStatic, ['-version']);
        if (test.status === 0) {
          this.ffmpegChecked = true;
          this.ffmpegPathResolved = ffmpegStatic;
          return this.ffmpegPathResolved;
        }
      }
    } catch (_) {
      // ignore if not installed
    }

    // 2) Common install locations (macOS/Homebrew, Linux)
    const commonPaths = [
      '/opt/homebrew/bin/ffmpeg', // Apple Silicon
      '/usr/local/bin/ffmpeg',
      '/usr/bin/ffmpeg',
      '/bin/ffmpeg',
    ];
    for (const p of commonPaths) {
      const test = spawnSync(p, ['-version']);
      if (test.status === 0) {
        this.ffmpegChecked = true;
        this.ffmpegPathResolved = p;
        return this.ffmpegPathResolved;
      }
    }

    // 3) PATH lookup
    const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', [
      'ffmpeg',
    ]);
    if (which.status === 0) {
      const out = which.stdout.toString().split('\n')[0].trim();
      if (out) {
        this.ffmpegChecked = true;
        this.ffmpegPathResolved = out;
        return this.ffmpegPathResolved;
      }
    }

    this.ffmpegChecked = true;
    this.ffmpegPathResolved = null;
    return null;
  }

  private getSecureFileExtension(file: Express.Multer.File): string {
    const mimeExtension = MIME_TO_EXTENSION[file.mimetype];

    if (!mimeExtension) {
      throw new HttpException(
        'Tipo de arquivo não suportado',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    const originalExtension = path.extname(file.originalname).toLowerCase();

    if (originalExtension && originalExtension !== mimeExtension) {
      throw new HttpException(
        'Extensão do arquivo não corresponde ao tipo de conteúdo',
        HttpStatus.BAD_REQUEST,
      );
    }

    return mimeExtension;
  }

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    body: UploadFileDto,
    file: Express.Multer.File,
  ) {
    const result = GetUserCompany(currentRequest);

    return this.execute({
      company: result.company,
      file,
      foldername: body.foldername,
      bucket: body.bucket,
      optimize_video: body.optimize_video,
    });
  }

  async execute(parameters: IUploadFile) {
    try {
      const fileExtension = this.getSecureFileExtension(parameters.file);
      const fileName = `${uuidv4()}${fileExtension}`;

      // Otimiza vídeo MP4 se habilitado (default: true)
      // const shouldOptimize =
      // parameters.optimize_video === undefined ? true : !!parameters.optimize_video;
      const fileToUpload = parameters.file;

      // if (
      //   shouldOptimize &&
      //   parameters.file.mimetype === 'video/mp4'
      // ) {
      //   try {
      //     const optimizedBuffer = await this.transcodeMp4Buffer(parameters.file.buffer);
      //     if (optimizedBuffer && optimizedBuffer.length > 0) {
      //       fileToUpload = this.googleCloudStorageService.bufferToMulterFile(
      //         optimizedBuffer,
      //         fileName,
      //         'video/mp4',
      //       );
      //     }
      //   } catch (err) {
      //     Log(
      //       LogType.INFO,
      //       UploadFileService.name,
      //       this.execute.name,
      //       LogAction.SKIP,
      //       {
      //         message:
      //           'FFmpeg not available or failed. Using original file. Set FFMPEG_PATH or install ffmpeg to enable optimization.',
      //         error: err?.message || err,
      //       },
      //     );
      //   }
      // }

      const storage = await this.googleCloudStorageService.uploadFile(
        parameters.company
          ? `${parameters.foldername}/${String(parameters.company)}`
          : `default/${parameters.foldername}`,
        fileName,
        fileToUpload,
        parameters.bucket,
      );

      const file = await this.model.create({
        company: parameters.company,
        bucket: parameters.bucket,
        path: storage.folder_name,
        file_name: storage.file_name,
        public_url: storage.public_url,
      });

      return { storage, file };
    } catch (error) {
      Log(
        LogType.ERROR,
        UploadFileService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters: { ...parameters, file: null }, error },
      );
      throw new HttpException(
        error?.message || RESULT.UPLOAD_FILE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  // Transcodifica MP4 para H.264 com CRF/preset definidos (mantém qualidade razoável)
  private async transcodeMp4Buffer(inputBuffer: Buffer): Promise<Buffer> {
    const ffmpegPath = this.resolveFfmpegPath();
    if (!ffmpegPath) {
      throw new Error('FFmpeg binary not found');
    }
    const tmp = tmpdir();
    const inputPath = join(tmp, `in-${uuidv4()}.mp4`);
    const outputPath = join(tmp, `out-${uuidv4()}.mp4`);

    await fs.writeFile(inputPath, inputBuffer);

    const crf = process.env.FFMPEG_CRF || '22';
    const preset = process.env.FFMPEG_PRESET || 'slow';
    const extraArgs = (process.env.FFMPEG_EXTRA_ARGS || '')
      .split(' ')
      .filter(Boolean);

    const args = [
      '-y',
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-preset',
      preset,
      '-crf',
      crf,
      '-profile:v',
      'high',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-c:a',
      'copy',
      ...extraArgs,
      outputPath,
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath, args);
      let stderr = '';
      proc.stderr.on('data', (d) => (stderr += d.toString()));
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      });
    });

    const out = await fs.readFile(outputPath);
    // Cleanup
    await Promise.allSettled([
      fs.unlink(inputPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {}),
    ]);
    return out;
  }
}
