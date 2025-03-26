import {
  IApiAdvertisementItem,
  IApiAdvertisementItemItem,
} from "@/backend/api/api.interface";
import { AdType } from "@/interfaces/ads";
import { MediaCropperModal } from "./Ads/ImageCropperModal";
import { useModal } from "@/hooks/useModal";
import { GetErrorMessage } from "@/utils/generic";
import { API } from "@/backend/api/api.endpoints";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { IToastType } from "@/interfaces/general";

export function AdvertisementComponent({
  onUpdate,
}: {
  onUpdate: (data: Partial<IApiAdvertisementItem>) => void;
}) {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const handleCroppedImage = async (croppedBlob: Blob, type: AdType) => {
    if (!session?.api_session) {
      return;
    }

    const response = await API.files.upload(session.api_session.access_token, {
      file: croppedBlob,
      company_id: "67d226d9b502526b43e5d1ed",
      foldername: "ads",
      bucket: "xmp-midia",
    });

    const responseData = await response.json();

    if (responseData?.error && responseData?.message) {
      showToast(GetErrorMessage(responseData.message), IToastType.ERROR);
    } else if (response.ok && responseData?.file?.public_url) {
      showToast(`Upload feito com sucesso!`, IToastType.SUCCESS);

      const newItem: IApiAdvertisementItemItem = {
        id: responseData?.file?._id,
        description: String(),
        seconds: 30,
        source: responseData?.file?.public_url,
        title: String(),
        type,
      };

      const updatedData = { items: [newItem], type };

      onUpdate(updatedData);
    } else {
      showToast(`Failed upload!`, IToastType.ERROR);
    }
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
