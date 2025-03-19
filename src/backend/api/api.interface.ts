import { AdPeriod, AdsAudience, AdStatus, AdType } from "@/interfaces/ads";
import {
  ICompanyDocumentType,
  ICompanyStatus,
  ICompanyType,
} from "@/interfaces/company";

export interface IApiPaginateParameters {
  page: number;
  limit: number;
  cache: boolean;
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

export interface IApiAdvertisementResponse {
  total: number;
  limit: number;
  pages: number;
  page: number;
  data: IApiAdvertisementItem[];
}

export interface IApiAdvertisementItemItem {
  id?: string;
  title: string;
  description: string;
  seconds: number;
  source: string;
  type: AdType;
}

export interface IApiAdvertisementItem {
  _id: string;
  company: string;
  title: string;
  // show: boolean;
  description: string;
  type: AdType;
  spotlight: boolean;
  items: IApiAdvertisementItemItem[];
  seconds: number;
  status: AdStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  audience: AdsAudience[];
  neighborhood: string[];
  segments: string[];
}

export interface IApiUnitItemResponse {
  _id: string;
  company: string;
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
  prices: {
    period: AdPeriod;
    seconds: number;
    display_times: number;
    price_total: number;
    average_visitors: number;
  }[];
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

export interface IApiNewsResponseItem {
  _id: string;
  provider: string;
  language: string;
  keyword: string;
  source_id: string | null;
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

export interface IApiNewsResponse {
  from: string;
  total: number;
  pages: number;
  page: number;
  provider: string | null;
  parameters: IApiPaginateParameters;
  data: IApiNewsResponseItem[];
}

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
  _id?: string;
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
