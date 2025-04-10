import { FromEnum } from 'src/shared/interfaces/paginate.dto';
import { ICurrencyName, ICurrencyProvider } from '../currency.interface';

export interface IGetCurrencyService {
  from: FromEnum;
  name: ICurrencyName;
}

export interface ICurrencyProviderAwesomeAPILast {
  USDBRL: {
    code: string;
    codein: string;
    name: string;
    high: string;
    low: string;
    varBid: string;
    pctChange: string;
    bid: string;
    ask: string;
    timestamp: string;
    create_date: string;
  };
}

export interface ICurrencyProviderCoingeckoSimplePrice {
  tether: {
    brl: number;
    brl_24h_change: number;
    last_updated_at: number;
  };
}

export interface ICurrencyGetFromProviderResult {
  name: ICurrencyName;
  provider: ICurrencyProvider;
  bid: number;
  high: number;
  low: number;
  pctChange: number;
  last_provided_at: Date;
}
