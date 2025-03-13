/* eslint-disable @typescript-eslint/no-explicit-any */

export enum EnumAdvertisementModalUnit {
  REMOVE_UNIT = "REMOVE_UNIT",
}

export interface IAdvertisementModalUnitCallback {
  type: EnumAdvertisementModalUnit;
  data: any;
}
