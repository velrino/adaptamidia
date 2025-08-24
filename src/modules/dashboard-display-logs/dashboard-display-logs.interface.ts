import { AggregationPeriod } from './dashboard-display-logs.schema';

export interface IDashboardResponse {
  global: {
    total_people: number;
    total_men: number;
    total_women: number;
    confidence: {
      average: number;
      max: number;
      min: number;
    };
    age: {
      max: number;
      min: number;
      average: number;
    };
  };
  entity?: {
    entity_id: string;
    total_people: number;
    total_men: number;
    total_women: number;
    confidence: {
      average: number;
      max: number;
      min: number;
    };
    age: {
      max: number;
      min: number;
      average: number;
    };
  };
  period: AggregationPeriod;
  date_range: {
    start: string;
    end: string;
  };
}

export enum EntityFieldEnum {
  local_unit = 'local_unit',
  news = 'news',
  advertisement = 'advertisement',
  advertiser = 'advertiser',
}
