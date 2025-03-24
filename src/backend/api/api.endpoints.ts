import {
  IApiAuthLogin,
  IApiPaginateCompanies,
  IApiRequestMethod,
} from "./api.interface";
import { ApiResources } from "./api.service";

export const API = {
  auth: {
    async login(data: IApiAuthLogin) {
      return ApiResources.request({
        method: IApiRequestMethod.POST,
        path: "/auth/login",
        data,
      });
    },
  },
  companies: {
    async paginate(access_token: string, data: IApiPaginateCompanies) {
      return ApiResources.request({
        method: IApiRequestMethod.GET,
        path: "/company",
        data,
        access_token,
      });
    },
  },
};
