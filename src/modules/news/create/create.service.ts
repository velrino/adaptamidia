import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { News, NewsDocument } from '../news.schema';
import { Model, Types } from 'mongoose';
import {
  CreateNewsDto,
  ICreateNews,
  ICreateNewsCommon,
} from './create.interface';
import { AuthenticatedRequest } from 'src/shared/request';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';

@Injectable()
export class CreateNewsService {
  constructor(
    @InjectModel(News.name)
    readonly model: Model<NewsDocument>,
  ) {}

  async executeFromController(
    currentRequest: AuthenticatedRequest,
    parameters: CreateNewsDto,
  ) {
    return await this.execute({
      ...parameters,
      user: String(currentRequest.user.user._id),
    });
  }

  async execute(parameters: ICreateNewsCommon) {
    try {
      const createParams: ICreateNews = {
        ...(parameters as ICreateNews),
      };

      if (typeof parameters.user === 'string' && parameters.user) {
        createParams.user = new Types.ObjectId(parameters.user);
      }

      const result = await this.model.create(createParams);

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        CreateNewsService.name,
        this.execute.name,
        LogAction.FAILED,
        { message: RESULT.FAILED_CREATE_NEWS, parameters, error },
      );
      throw new HttpException(
        RESULT.FAILED_CREATE_NEWS,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
