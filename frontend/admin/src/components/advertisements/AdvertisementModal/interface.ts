import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { ContentAction } from "@/interfaces/general";

export interface AdvertisementModalProps {
  action: ContentAction;
  data: IApiAdvertisementItem;
  onClose: () => void;
  onSuccess: (data: IApiAdvertisementItem) => void;
}

export interface AdvertisementFormProps {
  data: IApiAdvertisementItem;
  onUpdate: (data: Partial<IApiAdvertisementItem>) => void;
  action: ContentAction;
}
