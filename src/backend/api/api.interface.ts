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
