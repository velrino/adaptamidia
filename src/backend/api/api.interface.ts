/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  AdPeriod,
  AdsAudience,
  AdsCurrentType,
  AdStatus,
  AdType,
} from "@/interfaces/ads";
import {
  ICompanyDocumentType,
  ICompanyStatus,
  ICompanyType,
} from "@/interfaces/company";
import { FromEnum, IDay, SortOrder } from "@/interfaces/general";
import { EnumApiCompanyType } from "./api.enum";
import {
  DisplayLogStatus,
  DisplayType,
  IApiDashboardDisplayLogType,
} from "@/interfaces/display-logs";
import { IApiDashboardGeneralType } from "@/interfaces/dashboard";

export enum IApiRequestMethod {
  GET = "GET",
  DELETE = "DELETE",
  POST = "POST",
  PUT = "PUT",
}

export interface IApiRequest {
  method: IApiRequestMethod;
  path: string;
  data?: any;
  headers?: Headers;
  access_token?: string;
}

export interface IApiAuthLogin {
  email: string;
  password: string;
}

export interface IApiPaginateParameters {
  page?: number;
  limit?: number;
  cache?: boolean;
  sort?: SortOrder;
}

export interface IApiToken {
  id: string;
  iat: number;
  exp: number;
  expires_in: string;
}

export interface IApiUser {
  _id: string;
  name: string;
  email: string;
  permissions: string[];
  auth_type: string;
  otp: string;
  created_at: string;
  updated_at: string;
}

export interface IApiUserResponse {
  token: IApiToken;
  user: IApiUser;
}

export interface IApiPaginateAdvertisement extends IApiPaginateParameters {
  id?: string[] | string;
  title?: string;
}

export interface IApiPaginateAdvertisementPreview
  extends IApiPaginateParameters {
  id: string[] | string;
  title?: string;
}

export interface IApiAdvertisementResponse {
  total: number;
  limit: number;
  pages: number;
  page: number;
  data: IApiAdvertisementItem[];
}

export interface IApiAdvertisementItemCompanyResponse {
  _id: string;
  document: string;
  document_type: ICompanyDocumentType;
  name: string;
  type: ICompanyType;
  status: ICompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface IApiAdvertisementItem {
  _id: string;
  company: IApiAdvertisementItemCompanyResponse;
  title: string;
  // show: boolean;
  description: string;
  type: AdType;
  spotlight: boolean;
  seconds: number;
  status: AdStatus;
  source_landscape: string | null;
  source_portrait: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  plan: string;
  audience: AdsAudience[];
  neighborhood: string[];
  segments: string[];
  units: string[];
}

export interface IApiCreateAdvertisementRequest {
  company: string;
  title: string;
  plan: string;
  source_landscape: string;
  source_portrait: string;
  description: string;
  type: AdType;
  seconds: number;
  status: AdStatus;
  neighborhood: string[];
  audience: string[];
  segments: string[];
  units: string[];
  start_date: Date;
  end_date: Date;
}

export interface IApiUpdateAdvertisementRequest {
  company: string;
  title: string;
  plan: string;
  description: string;
  source_landscape: string;
  source_portrait: string;
  type: AdType;
  seconds: number;
  status: AdStatus;
  neighborhood: string[];
  audience: string[];
  segments: string[];
  units: string[];
  start_date: Date;
  end_date: Date;
}

// START NEWS

export interface IApiNewsResponseItem {
  _id: string;
  video?: string;
  provider: string;
  language: string;
  keyword: string;
  source_id: string | null;
  source_name: string;
  author: string;
  title: string;
  description: string;
  status: string;
  url: string;
  image: string;
  published_at: string;
  end_at: string;
  created_at: string;
  updated_at: string;
  neighborhood: string[];
  units: string[];
}

export interface IApiNewsResponse {
  from: string;
  total: number;
  pages: number;
  page: number;
  provider: string | null;
  parameters: IApiPaginateParameters;
  data: IApiNewsResponseItem[];
}

export interface IApiNewsRequest extends IApiPaginateParameters {
  id?: string[];
  search?: string;
}

// END NEWS

// START COMPANY

export interface IApiCreateCompanyRequest {
  document: string;
  type: ICompanyType;
  document_type: ICompanyDocumentType;
  name: string;
  status: ICompanyStatus;
}

export interface IApiUpdateCompanyRequest {
  document: string;
  type: ICompanyType;
  document_type: ICompanyDocumentType;
  name: string;
  status: ICompanyStatus;
}

export interface IApiCompanyResponse {
  _id: string;
  document: string;
  document_type: ICompanyDocumentType;
  name: string;
  type: ICompanyType;
  status: ICompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface IApiCompaniesResponse {
  pages: number;
  total: number;
  data: IApiCompanyResponse[];
  limit: number;
  page: number;
}

export interface IApiPaginateCompanies extends IApiPaginateParameters {
  name?: string;
  type?: EnumApiCompanyType;
}

// END COMPANY

export interface IApiGroupCompanyUnitsRequest {
  city?: string[];
  state?: string[];
  country?: string[];
  neighborhood?: string[];
  cache?: boolean;
}

export interface IApiGroupCompanyUnitsResponseItem {
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  count: number;
}

export interface IApiGroupCompanyUnitsResponse {
  data: IApiGroupCompanyUnitsResponseItem[];
}

// START UNIT

export interface IApiPaginateCompanyUnits extends IApiPaginateParameters {
  name?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
  city?: string[];
  state?: string[];
  country?: string[];
  units?: string[];
  neighborhood?: string | string[];
  popular_time?: boolean;
}

export interface IApiUnitItemCompanyResponse {
  _id: string;
  document: string;
  document_type: ICompanyDocumentType;
  name: string;
  type: ICompanyType;
  status: ICompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface IApiUnitItemResponse {
  _id: string;
  company: IApiUnitItemCompanyResponse;
  complement: string;
  name: string;
  image: string;
  full_address: string;
  neighborhood: string;
  address: string;
  city: string;
  state: string;
  country: string;
  street_number: string;
  type: string;
  status: string;
  devices: {
    smart_tv: number;
  };
  prices: IApiUnitPriceItemResponse[];
  popular_time: IApiUnitPopularTimeRecordResponse;
  max_capacity: number;
  location: {
    type: string;
    coordinates: [number, number];
  };
  created_at: string;
  updated_at: string;
}

export interface IApiUnitsResponse {
  total: number;
  pages: number;
  page: number;
  data: IApiUnitItemResponse[];
}

export interface IApiCreateCompanyUnitRequest {
  company_id: string;
  address: string;
  complement: string;
  type: string;
  image: string;
  name: string;
  status: string;
  devices: {
    smart_tv: number;
  };
  max_capacity: number;
}

export interface IApiUpdateCompanyUnitRequest {
  company_id: string;
  complement: string;
  name: string;
  image: string;
  full_address: string;
  // neighborhood: string;
  // address: string;
  // city: string;
  // state: string;
  // country: string;
  // street_number: string;
  type: string;
  status: string;
  devices: {
    smart_tv: number;
  };
  max_capacity: number;
  // location: {
  //   type: string;
  //   coordinates: [number, number];
  // };
}

export interface IApiUpdateCompanyUnitPricesRequest {
  prices: {
    period: AdPeriod;
    seconds: number;
    display_times: number;
    price_total: number;
    average_visitors: number;
  }[];
}

// END UNIT

// START POPULAR TIME

export interface IApiUnitPriceItemResponse {
  period: AdPeriod;
  seconds: number;
  display_times: number;
  price_total: number;
  average_visitors: number;
}

export interface IApiUnitPopularTimeItem {
  hour: string;
  count: number;
}

export interface IApiUnitPopularTimeDays {
  MONDAY: IApiUnitPopularTimeItem[];
  TUESDAY: IApiUnitPopularTimeItem[];
  WEDNESDAY: IApiUnitPopularTimeItem[];
  THURSDAY: IApiUnitPopularTimeItem[];
  FRIDAY: IApiUnitPopularTimeItem[];
  SATURDAY: IApiUnitPopularTimeItem[];
  SUNDAY: IApiUnitPopularTimeItem[];
}

export interface IApiUnitPopularTimeRecordResponse {
  _id: string;
  company_unit: string;
  days: Record<IDay, IApiUnitPopularTimeItem[]>;
}

export interface IApiUpdateCompanyUnitPopularTimesRequest {
  days: Record<IDay, IApiUnitPopularTimeItem[]>;
}
// END POPULAR TIME

// START UPLOAD FILES

export interface IApiUploadFileRequest {
  file: Blob;
  company_id?: string;
  foldername: string;
  bucket: string;
  optimize_video: boolean;
}

export interface IApiUplodadCameraFileRequest {
  file: Blob;
  timestamp: string;
  type: string;
  unit: string;
  record: string;
}

// DISPLAY

export interface IApiDisplayRequest extends IApiPaginateParameters {
  // Número mínimo de notícias antes de exibir um anúncio
  min_news_before_ad?: number;
  // Número máximo de notícias antes de exibir um anúncio
  max_news_before_ad?: number;
  // Número mínimo de anúncios em sequência
  min_ads_in_sequence?: number;
  // Número máximo de anúncios em sequência
  max_ads_in_sequence?: number;
  // Tamanho alvo (parece que houve uma mudança de 100 para 4)
  target_size?: number;
}

export interface IApiDisplayResponse {
  unit: IApiDisplayResponseUnit;
  paginate: IApiDisplayResponsePaginate;
  content: IApiDisplayResponseContent;
  data: IApiDisplayResponseItem[];
}

export interface IApiDisplayResponseUnit {
  _id: string;
  company: IApiDisplayResponseCompany;
  name: string;
  status: string;
  preferences: IApiDisplayResponseUnitPreferences;
}

export interface IApiDisplayResponseCompany {
  _id: string;
  name: string;
  status: string;
}

export interface IApiDisplayResponseUnitPreferences {
  exclude_news_source_name: any[];
  include_news_source_name: any[];
  min_news_before_ad: number;
  max_news_before_ad: number;
  min_ads_in_sequence: number;
  max_ads_in_sequence: number;
  target_size: number;
}

export interface IApiDisplayResponsePaginate {
  pages: number;
  total: number;
  limit: number;
  page: number;
}

export interface IApiDisplayResponseContent {
  total: number;
  ads: IApiDisplayResponseContentAds;
  news: IApiDisplayResponseContentNews;
}

export interface IApiDisplayResponseContentAds {
  total: number;
  unique: number;
}

export interface IApiDisplayResponseContentNews {
  total: number;
  unique: number;
}

export interface IApiDisplayResponseItem {
  type: AdsCurrentType;
  // data: IApiDisplayResponseItemAds | IApiDisplayResponseItemAdsNews;
  ads?: IApiDisplayResponseItemAds;
  news?: IApiDisplayResponseItemAdsNews;
}

export interface IApiDisplayResponseItemAds {
  _id: string;
  title: string;
  type: string;
  seconds: number;
  source_landscape: string | null;
  source_portrait: string | null;
  status: string;
  start_date: string;
  end_date: string;
}

export interface IApiDisplayResponseItemAdsNews {
  _id: string;
  provider: string;
  language: string;
  keyword: string;
  source_id: any;
  source_name: string;
  author: string;
  title: string;
  description: string;
  url: string;
  image: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

// DISPLAY LOGS

export interface IApiCreateDisplayLogRequest {
  identifier: string;
  id: string;
  local: string;
  type: DisplayType;
  status: DisplayLogStatus;
  start_at: string;
  end_at: string;
}

// START DASHBOARD DISPLAY

export interface IApiDashboardDisplayLogQueryDateToStringFormatDto {
  format: "%Y-%m-%d %H:%M" | "%Y-%m-%d";
  date: "$start_at";
  timezone: "America/Sao_Paulo";
}

export interface IApiDashboardDisplayLogQueryGroupTotalByTypeDto {
  type?: "$type";
  advertiser?: "$advertiser";
  local?: "$local";
  local_unit?: "$local_unit";
  start_at: {
    $dateToString: IApiDashboardDisplayLogQueryDateToStringFormatDto;
  };
}

export interface IApiDashboardDisplayLogQuerySortDto {
  column: "_id.start_at" | "total";
  value: 1 | -1;
}

export interface IApiDashboardDisplayLogRequest {
  from: FromEnum;
  page: number;
  limit: number;
  chart_type: IApiDashboardDisplayLogType;
  start_at: Date;
  end_at: Date;
  advertisement?: string[];
  news?: string[];
  advertiser?: string[];
  local?: string[];
  local_unit?: string[];
  type?: DisplayType[];
  status?: DisplayLogStatus[];
  query_group_total_by_type?: IApiDashboardDisplayLogQueryGroupTotalByTypeDto;
  sort: IApiDashboardDisplayLogQuerySortDto;
}

export interface IApiDashboardDisplayLogResponse {
  from: string;
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
  records: IApiDashboardDisplayLogRecord[];
}

export interface IApiDashboardDisplayLogRecord {
  _id: IApiDashboardDisplayLogRecordTypeWithStart;
  total: number;
}

export interface IApiDashboardDisplayLogRecordTypeWithStart {
  type: AdsCurrentType;
  start_at: string;
}
// END DASHBOARD DISPLAY

// START DASHBOARD RESUME

export interface IApiDashboardResumeRequest {
  from: FromEnum;
  chart_type: IApiDashboardGeneralType;
  start_at: Date;
  end_at: Date;
}

export interface IApiDashboardResumeResponse {
  from: FromEnum;
  display: {
    news: number;
    advertisement: number;
  };
  news: {
    total: number;
  };
  advertisement: {
    total: number;
  };
}

// END DASHBOARD RESUME

// START DASHBOARD DISPLAY_BY_ADVERTISEMENT

export interface IApiDashboardDisplayByAdvertisementRequest
  extends IApiDashboardResumeRequest {
  page: number;
  limit: number;
  local_unit?: string[];
  sort: {
    column: "total";
    value: -1 | 1;
  };
}

export interface IApiDashboardDisplayByAdvertisementItem {
  total: number;
  advertisement_id: string;
  advertisement_title: string;
  company_id: string;
  company_name: string;
}

export interface IApiDashboardDisplayByAdvertisementResponse {
  from: FromEnum;
  records: IApiDashboardDisplayByAdvertisementItem[];
}

// END DASHBOARD DISPLAY_BY_ADVERTISEMENT

// START DASHBOARD DISPLAY_BY_UNIT

export interface IApiDashboardDisplayByUnitRequest
  extends IApiDashboardResumeRequest {
  page: number;
  limit: number;
  advertisement?: string[];
  news?: string[];
  sort: {
    column: "total";
    value: -1 | 1;
  };
}

export interface IApiDashboardDisplayByUnitItem {
  total: number;
  type: AdsCurrentType;
  local_unit_id: string;
  local_unit_name: string;
}

export interface IApiDashboardDisplayByUnitResponse {
  from: FromEnum;
  records: IApiDashboardDisplayByUnitItem[];
}

// END DASHBOARD DISPLAY_BY_UNIT

// START DASHBOARD ADVERTISEMENT_BY_COMPANY

export interface IApiDashboardAdvertisementByCompanyRequest
  extends IApiDashboardResumeRequest {
  page: number;
  limit: number;
  sort: {
    column: "total";
    value: -1 | 1;
  };
}

export interface IApiDashboardAdvertisementByCompanyItem {
  total: number;
  company_id: AdsCurrentType;
  company_name: string;
}

export interface IApiDashboardAdvertisementByCompanyResponse {
  from: FromEnum;
  records: IApiDashboardAdvertisementByCompanyItem[];
}

// END DASHBOARD ADVERTISEMENT_BY_COMPANY

// START DISPLAY INFO
export interface IApiDisplayUnitInfoRequest {
  from: FromEnum;
}

export interface IApiCurrencyResponse {
  _id: string;
  name: string;
  bid: number;
  created_at: string;
  high: number;
  last_provided_at: string;
  low: number;
  pctChange: number;
  provider: string;
  updated_at: string;
}

export interface IApiWeatherResponse {
  _id: string;
  country: string;
  created_at: string;
  icon: string;
  last_provided_at: string;
  latitude: number;
  longitude: number;
  provider: string;
  region: string;
  temperature_c: number;
  temperature_f: number;
  text: string;
  timezone: string;
  updated_at: string;
}

export interface IApiDisplayUnitInfoResponse {
  from: FromEnum;
  unit: {
    _id: string;
    company: {
      _id: string;
      name: string;
      status: string;
    };
    name: string;
    city: string;
    state: string;
    country: string;
    status: string;
  };
  currency: IApiCurrencyResponse;
  weather: IApiWeatherResponse;
}

// END DISPLAY INFO

// START DISPLAY LOGS
export interface IApiPaginateDisplayLogs extends IApiPaginateParameters {
  id?: string[];
  local_unit?: string[];
  news?: string[];
  advertisement?: string[];
  advertiser?: string[];
  sort_by?: string;
  get_signed_url?: boolean;
  search?: string;
  start_date?: string;
  end_date?: boolean;
}

export interface IApiDisplayLogItem {
  _id: string;
  news?: {
    _id: string;
    source_name: string;
    author: string;
    title: string;
    description: string;
    image: string;
    url: string;
  };
  advertisement?: {
    _id: string;
    title: string;
    description: string;
    source_landscape: string;
    source_portrait: string;
  };
  advertiser?: string;
  local: string;
  device?: string;
  local_unit: {
    _id: string;
    name: string;
    full_address: string;
    type: string;
  };
  seconds: number;
  orientation: string;
  start_at: string;
  end_at: string;
  identifier: string;
  ip: string;
  user_agent: string;
  type: string;
  status: string;
  capture?: string | null;
  capture_bbox?: string | null;
  bucket?: string | null;
  yolo?: {
    people: number;
    confidence: number;
  } | null;
  deepface?: unknown | null;
  insightface?: {
    gender: {
      Woman: number;
      Man: number;
    };
    men: number;
    women: number;
    total: number;
    age: {
      max: number;
      min: number;
      average: number;
    };
    method?: string;
  } | null;
  created_at: string;
  updated_at: string;
  llm_insight?: string;
  llm_insight_model?: string;
  llm_insight_at?: string;
}

export interface IApiDisplayLogResponse {
  pages: number;
  total: number;
  data: IApiDisplayLogItem[];
}

// DETEC
export interface IApiDetectionDisplayLogDto {
  id: string;
}

// CREATE NEWS

export interface IApiCreateNews {
  provider: string;
  language: string;
  keyword: string;
  source_id: string;
  source_name: string;
  author: string;
  title: string;
  description: string;
  url: string;
  image: string;
  published_at: string;
  units: string[];
  neighborhood: string[];
}
