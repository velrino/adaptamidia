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

@Controller('files')
export class FilesController {
  constructor(
    private readonly uploadFileService: UploadFileService,
    private readonly deleteFileService: DeleteFileService,
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
}
