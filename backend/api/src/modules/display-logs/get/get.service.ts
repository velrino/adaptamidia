import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DisplayLog, DisplayLogDocument } from '../display-logs.schema';

import { News, NewsDocument } from 'src/modules/news/news.schema';
import { Model, FilterQuery } from 'mongoose';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { IPopulatedDisplayLog } from './get.interface';

@Injectable()
export class GetDisplayLogService {
  constructor(
    @InjectModel(DisplayLog.name)
    public readonly displayLogModel: Model<DisplayLogDocument>,
    @InjectModel(News.name)
    readonly newsModel: Model<NewsDocument>,
  ) {}

  async get(
    filter: FilterQuery<DisplayLogDocument>,
  ): Promise<IPopulatedDisplayLog> {
    const displayLogResult = await this.displayLogModel
      .findOne(filter)
      .select(['-data'])
      //   .select([
      //     '_id',
      //     'seconds',
      //     'start_at',
      //     'end_at',
      //     'identifier',
      //     'ip',
      //     'user_agent',
      //     'type',
      //     'status',
      //     'created_at',
      //     'updated_at',
      //     'local_unit',
      //     'news',
      //     'advertisement',
      //   ])
      .populate({
        path: 'news',
        select: ['_id', 'description', 'title', 'source_name', 'author'],
      })
      .populate({
        path: 'advertisement',
        select: ['_id', 'description', 'title'],
      })
      .populate({
        path: 'local_unit',
        select: ['_id', 'full_address', 'type', 'name'],
      })
      .lean<IPopulatedDisplayLog>();

    if (!displayLogResult) {
      Log(
        LogType.ERROR,
        GetDisplayLogService.name,
        this.get.name,
        LogAction.FAILED,
        { message: RESULT.DISPLAY_LOG_NOT_FOUND, filter },
      );
      throw new HttpException(
        RESULT.DISPLAY_LOG_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return displayLogResult;
  }
}
