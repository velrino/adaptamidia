import {
  IApiAdvertisementItem,
  IApiAdvertisementItemItem,
} from "@/backend/api/api.interface";
import { AdType } from "@/interfaces/ads";
import { MediaCropperModal } from "./Ads/ImageCropperModal";
import { useModal } from "@/hooks/useModal";

export function AdvertisementComponent({
  onUpdate,
}: {
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

  const modalMediaCropper = useModal();

  return (
    <div className="flex items-center justify-center min-h-full text-white text-center">
      <MediaCropperModal
        open={modalMediaCropper.isOpen}
        currentModal={modalMediaCropper}
        onCropComplete={handleCroppedImage}
      />
    </div>
  );
}
