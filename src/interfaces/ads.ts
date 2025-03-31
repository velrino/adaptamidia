import { IReactSelectOption } from "./general";

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

export const AdStatusOptions: IReactSelectOption[] = [
  { value: AdStatus.ACTIVE, label: "Ativo" },
  { value: AdStatus.REVIEW, label: "Em revisão" },
  { value: AdStatus.INACTIVE, label: "Inativo" },
  { value: AdStatus.ARCHIVED, label: "Arquivado" },
].sort((a, b) => a.label.localeCompare(b.label));

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

export const AdPeriodOptions: IReactSelectOption[] = [
  { value: AdPeriod.DAILY, label: AdPeriodText.DAILY },
  { value: AdPeriod.WEEKLY, label: AdPeriodText.WEEKLY },
  { value: AdPeriod.MONTHLY, label: AdPeriodText.MONTHLY },
  { value: AdPeriod.YEARLY, label: AdPeriodText.YEARLY },
].sort((a, b) => a.label.localeCompare(b.label));

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

// export interface IAdsCurrentItem {
//   type: AdsCurrentType;
//   data: IApiAdvertisementItem | IApiNewsResponseItem;
// }

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

export enum BrandSegment {
  AUTOMOTIVE = "AUTOMOTIVE",
  FASHION = "FASHION",
  TECHNOLOGY = "TECHNOLOGY",
  HEALTHCARE = "HEALTHCARE",
  FOOD_AND_BEVERAGE = "FOOD_AND_BEVERAGE",
  EDUCATION = "EDUCATION",
  FINANCE = "FINANCE",
  ENTERTAINMENT = "ENTERTAINMENT",
  SPORTS = "SPORTS",
  TRAVEL = "TRAVEL",
  BEAUTY = "BEAUTY",
  RETAIL = "RETAIL",
  TELECOMMUNICATIONS = "TELECOMMUNICATIONS",
  ENERGY = "ENERGY",
  REAL_ESTATE = "REAL_ESTATE",
  LOGISTICS = "LOGISTICS",
  HOSPITALITY = "HOSPITALITY",
  PETS = "PETS",
  GOVERNMENT = "GOVERNMENT",
  AGRICULTURE = "AGRICULTURE",
  AESTHETIC_CLINIC = "AESTHETIC_CLINIC",
  DENTAL_OFFICE = "DENTAL_OFFICE",
  INSURANCE_COMPANY = "INSURANCE_COMPANY",
  LAW_OFFICE = "LAW_OFFICE",
  MOBILE_ACCESSORY_STORE = "MOBILE_ACCESSORY_STORE",
  MEDICAL_CLINIC = "MEDICAL_CLINIC",
  LABORATORY = "LABORATORY",
}

export const BrandSegmentTranslations: Record<BrandSegment, string> = {
  [BrandSegment.AUTOMOTIVE]: "Automotivo",
  [BrandSegment.FASHION]: "Moda",
  [BrandSegment.TECHNOLOGY]: "Tecnologia",
  [BrandSegment.HEALTHCARE]: "Saúde",
  [BrandSegment.FOOD_AND_BEVERAGE]: "Alimentos e Bebidas",
  [BrandSegment.EDUCATION]: "Educação",
  [BrandSegment.FINANCE]: "Finanças",
  [BrandSegment.ENTERTAINMENT]: "Entretenimento",
  [BrandSegment.SPORTS]: "Esportes",
  [BrandSegment.TRAVEL]: "Viagem",
  [BrandSegment.BEAUTY]: "Beleza",
  [BrandSegment.RETAIL]: "Varejo",
  [BrandSegment.TELECOMMUNICATIONS]: "Telecomunicações",
  [BrandSegment.ENERGY]: "Energia",
  [BrandSegment.REAL_ESTATE]: "Imobiliário",
  [BrandSegment.LOGISTICS]: "Logística",
  [BrandSegment.HOSPITALITY]: "Hospitalidade",
  [BrandSegment.PETS]: "Pets",
  [BrandSegment.GOVERNMENT]: "Governo",
  [BrandSegment.AGRICULTURE]: "Agronegócio",
  [BrandSegment.AESTHETIC_CLINIC]: "Clínica de Estética",
  [BrandSegment.DENTAL_OFFICE]: "Consultório Odontológico",
  [BrandSegment.INSURANCE_COMPANY]: "Seguradora",
  [BrandSegment.LAW_OFFICE]: "Escritório de Advocacia",
  [BrandSegment.MOBILE_ACCESSORY_STORE]: "Loja de Acessórios para Celulares",
  [BrandSegment.MEDICAL_CLINIC]: "Clínica Médica",
  [BrandSegment.LABORATORY]: "Laboratório",
};
