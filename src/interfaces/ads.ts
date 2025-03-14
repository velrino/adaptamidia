import {
  IApiAdvertisementItem,
  IApiNewsResponseItem,
} from "@/backend/api/api.interface";

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

export enum AdPeriod {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export const AdPeriodText: Record<AdPeriod, string> = {
  [AdPeriod.DAILY]: "Diário",
  [AdPeriod.WEEKLY]: "Semanal",
  [AdPeriod.MONTHLY]: "Mensal",
  [AdPeriod.YEARLY]: "Anual",
};

export enum AdSortKey {
  company = "company",
  title = "title",
  type = "type",
  status = "status",
  seconds = "seconds",
  start_date = "start_date",
  end_date = "end_date",
}

export enum AdsCurrentType {
  ADVERTISEMENT = "ADVERTISEMENT",
  NEWS = "NEWS",
}

export interface IAdsCurrentItem {
  type: AdsCurrentType;
  data: IApiAdvertisementItem | IApiNewsResponseItem;
}

export interface IDisplayTheme {
  primary: string;
  text: string;
  secondary: string;
  description: string;
  description_text: string;
}

export const DisplayThemes: { [key: string]: IDisplayTheme } = {
  brand: {
    primary: "bg-brand-500",
    secondary: "bg-brand-600",
    text: "text-white",
    description: "bg-black",
    description_text: "text-white",
  },
  green: {
    primary: "bg-green-500",
    secondary: "bg-green-600",
    text: "text-white",
    description: "bg-green-950",
    description_text: "text-white",
  },
  violet: {
    primary: "bg-violet-500",
    secondary: "bg-violet-600",
    text: "text-white",
    description: "bg-violet-950",
    description_text: "text-white",
  },
  cyan: {
    primary: "bg-cyan-500",
    secondary: "bg-cyan-600",
    text: "text-white",
    description: "bg-cyan-950",
    description_text: "text-white",
  },
  red: {
    primary: "bg-red-500",
    secondary: "bg-red-600",
    text: "text-white",
    description: "bg-red-950",
    description_text: "text-white",
  },
  pink: {
    primary: "bg-pink-500",
    secondary: "bg-pink-600",
    text: "text-white",
    description: "bg-pink-950",
    description_text: "text-white",
  },
  orange: {
    primary: "bg-orange-500",
    secondary: "bg-orange-600",
    text: "text-white",
    description: "bg-orange-950",
    description_text: "text-white",
  },
};

export enum AdsAudience {
  EXECUTIVES = "executives",
  TOURISTS = "tourists",
  PASSENGERS = "passengers",
  DRIVERS = "drivers",
  STUDENTS = "students",
  CONSUMERS = "consumers",
  FANS = "fans",
  PARTYGOERS = "partygoers",
  SHOPPERS = "shoppers",
  ATHLETES = "athletes",
}

export interface IAdvertisementFormItem {
  id?: string;
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
