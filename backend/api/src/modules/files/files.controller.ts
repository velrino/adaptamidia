import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
  Body,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileService } from './upload/upload.service';
import { AuthenticatedRequest } from 'src/shared/request';
import { AuthJwtGuard } from '../auth/auth.guard';
import { UploadFileDto } from './upload/upload.interface';
import { DeleteFileDto } from './delete/delete.interface';
import { DeleteFileService } from './delete/delete.service';
import { UplodadCameraFileService } from './camera/camera.service';
import { UplodadCameraFileDto } from './camera/camera.interface';

@Controller('files')
export class FilesController {
  constructor(
    private readonly uploadFileService: UploadFileService,
    private readonly deleteFileService: DeleteFileService,
    private readonly uplodadCameraFileService: UplodadCameraFileService,
  ) {}

  @Post()
  @UseGuards(AuthJwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: AuthenticatedRequest,
    @Body() body: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadFileService.executeFromRequest(req, body, file);
  }

  @Delete()
  @UseGuards(AuthJwtGuard)
  async deleteFile(
    @Req() req: AuthenticatedRequest,
    @Body() body: DeleteFileDto,
  ) {
    return this.deleteFileService.executeFromRequest(req, body);
  }

  @Post('camera')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  async uploadWebcam(
    @Body() body: UplodadCameraFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uplodadCameraFileService.executeFromRequest(body, file);
  }
}
