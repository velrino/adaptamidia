import { IApiAuthLogin, IApiRequestMethod } from "./api.interface";
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
};
