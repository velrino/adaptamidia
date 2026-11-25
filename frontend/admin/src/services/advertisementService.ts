import { API } from "@/backend/api/api.endpoints";
import { IApiAdvertisementItem, IApiCreateAdvertisementRequest, IApiUpdateAdvertisementRequest } from "@/backend/api/api.interface";
import { GetErrorMessage } from "@/utils/generic";

export interface AdvertisementServiceResult {
  success: boolean;
  data?: IApiAdvertisementItem;
  error?: string;
}

export const advertisementService = {
  async create(token: string, data: IApiCreateAdvertisementRequest): Promise<AdvertisementServiceResult> {
    try {
      const response = await API.advertisement.create(token, data);
      const responseData = await response.json();

      if (responseData?.error && responseData?.message) {
        return {
          success: false,
          error: GetErrorMessage(responseData.message)
        };
      }

      if (response.ok && responseData?._id) {
        return {
          success: true,
          data: responseData
        };
      }

      return {
        success: false,
        error: "Falha na criação do anúncio"
      };
    } catch (error) {
      return {
        success: false,
        error: GetErrorMessage(error)
      };
    }
  },

  async update(token: string, id: string, data: IApiUpdateAdvertisementRequest): Promise<AdvertisementServiceResult> {
    try {
      const response = await API.advertisement.update(token, id, data);
      const responseData = await response.json();

      if (responseData?.error && responseData?.message) {
        return {
          success: false,
          error: GetErrorMessage(responseData.message)
        };
      }

      if (response.ok && responseData?._id) {
        return {
          success: true,
          data: responseData
        };
      }

      return {
        success: false,
        error: "Falha na atualização do anúncio"
      };
    } catch (error) {
      return {
        success: false,
        error: GetErrorMessage(error)
      };
    }
  }
};