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
import { useLoading } from "@/context/LoadingContext";
import { GenerateAdvertisementModal } from "./Ads/GenerateModal";

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
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    } finally {
      hideFullScreenLoading();
    }
  };

  const handleGenerated = async (fileUrl: string) => {
    if (!session?.api_session) {
      return;
    }

    if (!data?.company) {
      showToast("Escolha um Anunciante!", IToastType.INFO);
      return;
    }

    try {
      showFullScreenLoading();

      showToast(`Upload feito com sucesso!`, IToastType.SUCCESS);

      const newItem: IApiAdvertisementItemItem = {
        id: new Date().getTime().toString(),
        description: String(),
        seconds: 30,
        source: fileUrl,
        title: String(),
        type: AdType.VIDEO,
      };

      const updatedData = { items: [newItem], type: AdType.VIDEO };

      onUpdate(updatedData);
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    } finally {
      hideFullScreenLoading();
    }
  };

  const modalMediaCropper = useModal();
  const modalGenerate = useModal();

  return (
    <>
      <div className="flex items-center justify-center min-h-full text-white text-center">
        {!data.company?._id && (
          <div>
            Selecione um <strong>Anúnciante</strong> antes de fazer upload
          </div>
        )}

        {data.company?._id && (
          <>
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-6">
                <GenerateAdvertisementModal
                  open={modalGenerate.isOpen}
                  currentModal={modalGenerate}
                  onCropComplete={handleGenerated}
                />
              </div>
              <div className="col-span-6">
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
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
