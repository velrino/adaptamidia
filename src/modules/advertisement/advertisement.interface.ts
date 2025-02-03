import { Advertisement } from './advertisement.schema';

export type IAdvertisement = Document & Advertisement;

export enum AdvertisementType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum AdvertisementStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVIEW = 'REVIEW',
}
