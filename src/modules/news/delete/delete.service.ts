import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { News, NewsDocument } from '../news.schema';
import { Model, Types } from 'mongoose';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';

@Injectable()
export class DeleteNewsService {
  constructor(
    @InjectModel(News.name)
    readonly model: Model<NewsDocument>,
  ) {}

  async executeFromController(id: string) {
    return await this.execute(new Types.ObjectId(id));
  }

  async execute(_id: Types.ObjectId) {
    try {
      const record = await this.model.countDocuments({ _id });

      if (!record) {
        throw new HttpException(RESULT.NEWS_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      const result = await this.model.deleteOne({ _id });

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DeleteNewsService.name,
        this.execute.name,
        LogAction.FAILED,
        { message: RESULT.FAILED_DELETE_NEWS, _id, error },
      );
      throw new HttpException(
        error?.message || RESULT.FAILED_DELETE_NEWS,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
