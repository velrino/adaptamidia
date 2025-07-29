import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { FilesController } from './files.controller';
import { UploadFileService } from './upload/upload.service';
import { DeleteFileService } from './delete/delete.service';
import { UplodadCameraFileService } from './camera/camera.service';

@Module({
  imports: [
    MongooseModule.forFeature([MongoCollection.files]),
    MongooseModule.forFeature([MongoCollection.display_logs]),
  ],
  controllers: [FilesController],
  providers: [
    GoogleCloudStorageService,
    UploadFileService,
    DeleteFileService,
    UplodadCameraFileService,
  ],
})
export class FilesModule {}
