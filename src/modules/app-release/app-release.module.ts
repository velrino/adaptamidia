import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AppReleaseController } from './app-release.controller';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { FirebaseModule } from 'src/shared/firebase/firebase.module';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
    FirebaseModule,
  ],
  controllers: [AppReleaseController],
  providers: [GoogleCloudStorageService],
})
export class AppReleaseModule {}
