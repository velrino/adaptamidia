import {
  Advertisement,
  AdvertisementMetricsItem,
} from './advertisement.schema';

export type IAdvertisement = Document & Advertisement;

export enum AdvertisementType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  UNDEFINED = 'UNDEFINED',
}

export enum AdvertisementStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVIEW = 'REVIEW',
  ARCHIVED = 'ARCHIVED',
}

export const AdvertisementMetricsItemDefault: AdvertisementMetricsItem = {
  errors: 0,
  impressions: 0,
  last_updated: new Date(),
  skips: 0,
  watched: 0,
};
