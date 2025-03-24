import {
  IApiAuthLogin,
  IApiPaginateCompanies,
  IApiRequestMethod,
  IApiUpdateCompanyRequest,
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
    async create(access_token: string, data: IApiUpdateCompanyRequest) {
      return ApiResources.request({
        method: IApiRequestMethod.POST,
        path: "/company",
        data,
        access_token,
      });
    },
    async update(
      access_token: string,
      id: string,
      data: IApiUpdateCompanyRequest
    ) {
      return ApiResources.request({
        method: IApiRequestMethod.PUT,
        path: `/company/${id}`,
        data,
        access_token,
      });
    },
  },
};
