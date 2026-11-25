import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createHash } from 'node:crypto';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';
import { FirebaseDatabaseService } from 'src/shared/firebase/firebase-database.service';
import { FirebasePathsEnum } from 'src/shared/firebase/firebase.enum';

@Controller('app-release')
export class AppReleaseController {
  constructor(
    private readonly gcs: GoogleCloudStorageService,
    private readonly firebase: FirebaseDatabaseService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadApk(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'device',
    @Query('filename') filename = 'app-release.apk',
    @Query('public') makePublic = 'true',
    @Query('version_code') versionCode?: string,
    @Query('version_name') versionName?: string,
    @Query('min_version_code') minVersionCode?: string,
  ) {
    if (!file)
      throw new BadRequestException(
        'file is required (multipart/form-data field name: file)',
      );
    if (!file.mimetype || !file.mimetype.includes('application')) {
      // APKs are application/vnd.android.package-archive but allow any application/*
    }

    // Compute SHA-256
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');

    const uploaded = await this.gcs.uploadFile(
      folder,
      filename,
      file,
      IGoogleStorageBucket.ADAPTA_MIDIA,
      makePublic !== 'false',
    );

    // Update RELEASE (or DEV_RELEASE) record in RTDB
    const vc = versionCode ? parseInt(versionCode, 10) : undefined;
    const mvc = minVersionCode ? parseInt(minVersionCode, 10) : undefined;
    if (!vc || isNaN(vc)) {
      throw new BadRequestException(
        'version_code (number) is required as query param',
      );
    }

    const releasePayload: any = {
      version_code: vc,
      apk_url: uploaded.public_url,
      sha256,
    };
    if (versionName) releasePayload.version_name = versionName;
    if (mvc && !isNaN(mvc)) releasePayload.min_version_code = mvc;

    await this.firebase.setRoot(FirebasePathsEnum.RELEASE, releasePayload);

    return {
      ...uploaded,
      size: file.size,
      sha256,
      release: releasePayload,
    };
  }
}
