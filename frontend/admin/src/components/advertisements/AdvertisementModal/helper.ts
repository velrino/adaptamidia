import { IApiUnitItemResponse } from "@/backend/api/api.interface";

export const SumAllDevices = (units: IApiUnitItemResponse[]) => {
  return units.reduce((total, obj) => {
    return (
      total +
      Object.values(obj.devices || {}).reduce((sum, num) => sum + num, 0)
    );
  }, 0);
};
