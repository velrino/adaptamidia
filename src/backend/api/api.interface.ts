import { AdsAudience, AdStatus, AdType } from "@/interfaces/ads";

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

export interface IApiAdvertisementItem {
  _id: string;
  company: string;
  title: string;
  type: AdType;
  items: {
    title: string;
    description: string;
    seconds: number;
    source: string;
    type: AdType;
  }[];
  seconds: number;
  status: AdStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  audience: AdsAudience[];
}

export interface IApiUnitItemResponse {
  _id: string;
  company: string;
  name: string;
  address: string;
  type: string;
  status: string;
  average_visitors: {
    daily: number;
    weekly: number;
    monthly: number;
  };
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
