import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';
import { Company } from '../company.schema';
import { CreateCompanyValidator } from './create.interface';

@Injectable()
export class CreateCompanyService {
  constructor(@InjectModel(Company.name) public model: Model<Company>) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: CreateCompanyValidator,
  ) {
    return this.execute(parameters);
  }

  execute(parameters: CreateCompanyValidator) {
    return parameters;
  }
}
