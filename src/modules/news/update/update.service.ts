import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { News, NewsDocument } from '../news.schema';
import { Model, Types } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { UpdateNewsDto } from './update.interface';
import { ICreateNewsCommon } from '../create/create.interface';

@Injectable()
export class UpdateNewsService {
  constructor(
    @InjectModel(News.name)
    readonly model: Model<NewsDocument>,
  ) {}

  async executeFromController(
    id: string,
    currentRequest: AuthenticatedRequest,
    parameters: UpdateNewsDto,
  ) {
    return await this.execute(new Types.ObjectId(id), {
      ...parameters,
      user: String(currentRequest.user.user._id),
    });
  }

  async execute(_id: Types.ObjectId, parameters: ICreateNewsCommon) {
    try {
      const params = {
        ...parameters,
      };

      if (typeof parameters.user === 'string' && parameters.user) {
        params.user = new Types.ObjectId(parameters.user);
      }

      const record = await this.model.countDocuments({ _id });

      if (!record) {
        throw new HttpException(RESULT.NEWS_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      const result = await this.model.findOneAndUpdate({ _id }, params, {
        upsert: false,
        new: true,
      });

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        UpdateNewsService.name,
        this.execute.name,
        LogAction.FAILED,
        { message: RESULT.FAILED_UPDATE_NEWS, parameters, error },
      );
      throw new HttpException(
        RESULT.FAILED_UPDATE_NEWS,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
