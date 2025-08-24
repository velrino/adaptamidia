import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { AdType } from "@/interfaces/ads";
import { MediaCropperModal } from "./Ads/ImageCropperModal";
import { useModal } from "@/hooks/useModal";
import { GetErrorMessage } from "@/utils/generic";
import { API } from "@/backend/api/api.endpoints";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { IToastType } from "@/interfaces/general";
import { useLoading } from "@/context/LoadingContext";

export function AdvertisementComponent({
  data,
  onUpdate,
}: {
  data: IApiAdvertisementItem;
  onUpdate: (payload: Partial<IApiAdvertisementItem>) => void;
}) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { showFullScreenLoading, hideFullScreenLoading } = useLoading();

  const handleCroppedImage = async (croppedBlob: Blob, type: AdType) => {
    if (!session?.api_session) {
      return;
    }

    if (!data?.company) {
      showToast("Escolha um Anunciante!", IToastType.INFO);
      return;
    }

    try {
      showFullScreenLoading();
      const response = await API.files.upload(
        session.api_session.access_token,
        {
          file: croppedBlob,
          company_id: data.company._id,
          foldername: "ads",
          bucket: "adapta-midia",
        }
      );

      const responseData = await response.json();

      if (responseData?.error && responseData?.message) {
        showToast(GetErrorMessage(responseData.message), IToastType.ERROR);
      } else if (response.ok && responseData?.file?.public_url) {
        showToast(`Upload feito com sucesso!`, IToastType.SUCCESS);

        const updatedData = { source: responseData?.file?.public_url, type };

        onUpdate(updatedData);
      } else {
        showToast(`Failed upload!`, IToastType.ERROR);
      }
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    } finally {
      hideFullScreenLoading();
    }
  };

  const modalMediaCropper = useModal();

  return (
    <>
      {!data.company?._id && (
        <div>
          Selecione um <strong>Anúnciante</strong> antes de fazer upload
        </div>
      )}

      {data.company?._id && (
        <>
          <MediaCropperModal
            open={modalMediaCropper.isOpen}
            currentModal={modalMediaCropper}
            onCropComplete={handleCroppedImage}
            // file={{
            //   source:
            //     "https://storage.googleapis.com/xmp-midia/ads/67f9c0e21d68c92defe72f87/24a361d3-5a76-47ec-b157-8d078dc3d99d",
            //   type: "video",
            // }}
          />
        </>
      )}
    </>
  );
}
