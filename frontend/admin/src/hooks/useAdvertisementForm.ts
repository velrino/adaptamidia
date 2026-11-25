import { useState } from "react";
import {
  IApiAdvertisementItem,
  IApiCreateAdvertisementRequest,
  IApiUpdateAdvertisementRequest,
} from "@/backend/api/api.interface";
import { ContentAction, IToastType } from "@/interfaces/general";
import { useToast } from "@/context/ToastContext";
import { useSession } from "next-auth/react";
import { useLoading } from "@/context/LoadingContext";
import { Default } from "@/backend/mock/advertisements";

export const useAdvertisementForm = (
  initialData: IApiAdvertisementItem,
  action: ContentAction
) => {
  const [data, setData] = useState<IApiAdvertisementItem>(initialData);
  const [loadingSave, setLoadingSave] = useState(false);

  const { showToast } = useToast();
  const { data: session } = useSession();
  const { showFullScreenLoading, hideFullScreenLoading } = useLoading();

  const handleUpdate = (updatedData: Partial<IApiAdvertisementItem>) => {
    setData((prev) => ({ ...prev, ...updatedData }));
  };

  const validateForm = (): boolean => {
    if (!data.company) {
      showToast("Escolha um Anunciante!", IToastType.ERROR);
      return false;
    }
    return true;
  };

  const buildRequestData = ():
    | IApiCreateAdvertisementRequest
    | IApiUpdateAdvertisementRequest => {
    return {
      company: data.company._id,
      title: data.title,
      plan: data.plan,
      description: data.description,
      type: data.type,
      source_landscape:
        data.source_landscape !== Default.video.landscape
          ? String(data.source_landscape)
          : String(data.source_portrait),
      source_portrait:
        data.source_portrait !== Default.video.portrait
          ? String(data.source_portrait)
          : String(data.source_landscape),
      seconds: data.seconds,
      status: data.status,
      neighborhood: data.neighborhood,
      audience: data.audience,
      segments: data.segments,
      units: data.units,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
    };
  };

  return {
    data,
    setData,
    loadingSave,
    setLoadingSave,
    handleUpdate,
    validateForm,
    buildRequestData,
    session,
    showToast,
    showFullScreenLoading,
    hideFullScreenLoading,
    action,
  };
};
