import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileService } from './upload/upload.service';
import { AuthenticatedRequest } from 'src/shared/request';
import { AuthJwtGuard } from '../auth/auth.guard';
import { UploadFileDto } from './upload/upload.interface';

@Controller('files')
export class FilesController {
  constructor(private readonly uploadFileService: UploadFileService) {}

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
}
