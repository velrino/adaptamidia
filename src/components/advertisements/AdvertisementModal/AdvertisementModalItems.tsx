import {
  IApiAdvertisementItem,
  IApiAdvertisementItemItem,
} from "@/backend/api/api.interface";
import { AdType } from "@/interfaces/ads";
import { AdvertisementItems } from "./Ads/MediaList";

export function AdvertisementComponent({
  items,
  onUpdate,
}: {
  items: IApiAdvertisementItemItem[];
  onUpdate: (data: Partial<IApiAdvertisementItem>) => void;
}) {
  const handleCroppedImage = (croppedBlob: Blob, type: AdType) => {
    const newItem: IApiAdvertisementItemItem = {
      id: new Date().getTime().toString(),
      description: String(),
      seconds: 30,
      source: URL.createObjectURL(croppedBlob),
      title: String(),
      type,
    };

    const updatedData = { items: [newItem], type };

    onUpdate(updatedData);
  };

  return (
    <AdvertisementItems items={items} onCropComplete={handleCroppedImage} />
  );
}
