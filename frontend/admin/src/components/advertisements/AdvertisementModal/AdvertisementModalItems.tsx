import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { AdType } from "@/interfaces/ads";
import { MediaCropperModal, CropOrientation } from "./Ads/ImageCropperModal";
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

  const uploadAndUpdate = async (
    croppedBlob: Blob,
    type: AdType,
    target: "landscape" | "portrait"
  ) => {
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
          optimize_video: true,
        }
      );

      const responseData = await response.json();

      if (responseData?.error && responseData?.message) {
        showToast(GetErrorMessage(responseData.message), IToastType.ERROR);
      } else if (response.ok && responseData?.file?.public_url) {
        showToast(`Upload feito com sucesso!`, IToastType.SUCCESS);
        const url = responseData?.file?.public_url as string;
        const updatedData: Partial<IApiAdvertisementItem> =
          target === "landscape"
            ? { source_landscape: url, type }
            : { source_portrait: url, type };
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

  const modalMediaCropperLandscape = useModal();
  const modalMediaCropperPortrait = useModal();

  return (
    <>
      <div className="grid justify-center w-full gap-6">
        <div className="w-full max-w-[720px] rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-4">
          <div className="mb-3">
            <h4 className="text-gray-900 dark:text-white/90 font-medium">
              Vídeo Landscape (16:9)
            </h4>
            <p className="text-gray-500 dark:text-white/60 text-sm">
              Para telas horizontais. Recomendado: 1920x1080.
            </p>
          </div>
          <div
            className="relative w-full bg-black/90 rounded-lg overflow-hidden"
            style={{ aspectRatio: "16 / 9" }}
          >
            {data.source_landscape ? (
              <video
                src={data.source_landscape}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">
                Sem vídeo landscape
              </div>
            )}
          </div>
          {!data.company?._id && (
            <div>
              Selecione um <strong>Anúnciante</strong> antes de fazer upload
            </div>
          )}
          {data.company?._id && (
            <div className="mt-4">
              <MediaCropperModal
                open={modalMediaCropperLandscape.isOpen}
                currentModal={modalMediaCropperLandscape}
                onCropComplete={(blob, type) =>
                  uploadAndUpdate(blob, type, "landscape")
                }
                orientation={CropOrientation.Landscape}
                buttonLabel="Upload Vídeo Landscape"
              />
            </div>
          )}
        </div>
        <div className="w-full max-w-[420px] rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-4 mb-20">
          <div className="mb-3">
            <h4 className="text-gray-900 dark:text-white/90 font-medium">
              Vídeo Portrait (9:16)
            </h4>
            <p className="text-gray-500 dark:text-white/60 text-sm">
              Para telas verticais. Recomendado: 1080x1920.
            </p>
          </div>
          <div
            className="relative w-full bg-black rounded-lg overflow-hidden"
            style={{ aspectRatio: "9 / 16" }}
          >
            {data.source_portrait ? (
              <video
                src={data.source_portrait}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">
                Sem vídeo portrait
              </div>
            )}
          </div>
          {!data.company?._id && (
            <div>
              Selecione um <strong>Anúnciante</strong> antes de fazer upload
            </div>
          )}
          {data.company?._id && (
            <div className="mt-4">
              <MediaCropperModal
                open={modalMediaCropperPortrait.isOpen}
                currentModal={modalMediaCropperPortrait}
                onCropComplete={(blob, type) =>
                  uploadAndUpdate(blob, type, "portrait")
                }
                orientation={CropOrientation.Portrait}
                buttonLabel="Upload Vídeo Portrait"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
