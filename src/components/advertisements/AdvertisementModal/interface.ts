import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { ContentAction } from "@/interfaces/general";

export interface AdvertisementModalCommonProps {
  action: ContentAction;
  data: IApiAdvertisementItem;
  onCallback?: (callback: IApiAdvertisementItem) => void;
}
