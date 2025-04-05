import { GetExtensionFromMimeType } from "@/utils/generic";
import {
  IApiAuthLogin,
  IApiCreateAdvertisementRequest,
  IApiCreateCompanyUnitRequest,
  IApiCreateDisplayLogRequest,
  IApiDashboardDisplayLogRequest,
  IApiDashboardResumeRequest,
  IApiDisplayRequest,
  IApiGroupCompanyUnitsRequest,
  IApiPaginateAdvertisement,
  IApiPaginateAdvertisementPreview,
  IApiPaginateCompanies,
  IApiPaginateCompanyUnits,
  IApiRequestMethod,
  IApiUpdateAdvertisementRequest,
  IApiUpdateCompanyRequest,
  IApiUpdateCompanyUnitRequest,
  IApiUploadFileRequest,
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
  advertisement: {
    async paginate(access_token: string, data: IApiPaginateAdvertisement) {
      return ApiResources.request({
        method: IApiRequestMethod.GET,
        path: "/advertisement",
        data,
        access_token,
      });
    },
    async create(access_token: string, data: IApiCreateAdvertisementRequest) {
      return ApiResources.request({
        method: IApiRequestMethod.POST,
        path: "/advertisement",
        data,
        access_token,
      });
    },
    async update(
      access_token: string,
      id: string,
      data: IApiUpdateAdvertisementRequest
    ) {
      return ApiResources.request({
        method: IApiRequestMethod.PUT,
        path: `/advertisement/${id}`,
        data,
        access_token,
      });
    },
    async preview(data: IApiPaginateAdvertisementPreview) {
      return ApiResources.request({
        method: IApiRequestMethod.GET,
        path: "/advertisement/preview",
        data,
      });
    },
    async display(id: string, data: IApiDisplayRequest) {
      return ApiResources.request({
        method: IApiRequestMethod.GET,
        path: `/advertisement/display/${id}`,
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
  company_units: {
    async paginate(access_token: string, data: IApiPaginateCompanyUnits) {
      return ApiResources.request({
        method: IApiRequestMethod.GET,
        path: "/company/unit",
        data,
        access_token,
      });
    },
    async create(access_token: string, data: IApiCreateCompanyUnitRequest) {
      return ApiResources.request({
        method: IApiRequestMethod.POST,
        path: "/company/unit",
        data,
        access_token,
      });
    },
    async update(
      access_token: string,
      id: string,
      data: IApiUpdateCompanyUnitRequest
    ) {
      return ApiResources.request({
        method: IApiRequestMethod.PUT,
        path: `/company/unit/${id}`,
        data,
        access_token,
      });
    },
    async group(access_token: string, data: IApiGroupCompanyUnitsRequest) {
      return ApiResources.request({
        method: IApiRequestMethod.GET,
        path: "/company/unit/group",
        data,
        access_token,
      });
    },
  },
  dashboard: {
    async displayLogs(
      access_token: string,
      data: IApiDashboardDisplayLogRequest
    ) {
      return ApiResources.request({
        method: IApiRequestMethod.POST,
        path: "/dashboard/display",
        data,
        access_token,
      });
    },
    async generalResume(
      access_token: string,
      data: IApiDashboardResumeRequest
    ) {
      return ApiResources.request({
        method: IApiRequestMethod.POST,
        path: "/dashboard/general",
        data,
        access_token,
      });
    },
  },
  display_logs: {
    async create(data: IApiCreateDisplayLogRequest) {
      return ApiResources.request({
        method: IApiRequestMethod.POST,
        path: "/display/log",
        data,
        // access_token,
      });
    },
  },
  files: {
    async upload(access_token: string, data: IApiUploadFileRequest) {
      const formData = new FormData();
      const mimeType = data.file.type;
      const fileExtension = GetExtensionFromMimeType(mimeType);
      const filename = `file.${fileExtension}`;

      formData.append("file", data.file, filename);
      formData.append("company_id", data.company_id);
      formData.append("foldername", data.foldername);
      formData.append("bucket", data.bucket);

      return ApiResources.request({
        method: IApiRequestMethod.POST,
        path: "/files",
        data: formData,
        access_token,
      });
    },
  },
};
