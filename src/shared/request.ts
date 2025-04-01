import { Request } from 'express';
import { IpSourceEnum } from './enums/ip-source.enum';
import { IResult as IUserAgentParserResult } from 'ua-parser-js';
import { IncomingHttpHeaders } from 'http';
import { Authenticated } from 'src/modules/auth/auth.interface';

export interface RequestCustomClient extends IUserAgentParserResult {
  ip: string | null;
  latitude: number;
  longitude: number;
  source: IpSourceEnum;
  timezone: string;
  headers?: IncomingHttpHeaders;
}

export interface CustomRequest extends Request {
  custom_client: RequestCustomClient;
}

export interface AuthenticatedRequest extends CustomRequest {
  user: Authenticated;
}
