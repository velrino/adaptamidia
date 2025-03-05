export enum AdType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

export enum AdStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  REVIEW = "REVIEW",
  ARCHIVED = "ARCHIVED",
}

export enum AdSortKey {
  company = "company",
  title = "title",
  type = "type",
  status = "status",
  seconds = "seconds",
  start_date = "start_date",
  end_date = "end_date",
}

export interface IAdvertisementFormItem {
  id: string;
  title: string;
  description: string;
  seconds: number;
  source: string;
  type: AdType;
}

export enum AdsViewBy {
  strategy = "strategy",
  ads = "ads",
}

export enum AdsShowType {
  ANYTIME = "ANYTIME",
  SPECIFIC_WEEKDAY = "SPECIFIC_WEEKDAY",
  SPECIFIC_DATETIME = "SPECIFIC_DATETIME",
}

export interface IAdAboutDisplay {
  amount: number;
  amount_formated: string;
}

export interface IAdsDayTimes {
  [day: string]: { hour: string }[];
}
