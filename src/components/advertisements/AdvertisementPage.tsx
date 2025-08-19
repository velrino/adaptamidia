/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/button/Button";
import { ContentAction, IToastType } from "@/interfaces/general";
import { AdvertisementFormProps } from "./AdvertisementModal/interface";
import { useAdvertisementForm } from "@/hooks/useAdvertisementForm";
import { advertisementService } from "@/services/advertisementService";
import AdvertisementForm from "./AdvertisementForm";
import Spinner from "../ui/spinner/Spinner";

interface AdvertisementPageProps
  extends Omit<AdvertisementFormProps, "onUpdate"> {
  onSuccess?: (data: any) => void;
}

export default function AdvertisementPage({
  action,
  data: advertisementData,
  onSuccess,
}: AdvertisementPageProps) {
  const router = useRouter();

  const {
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
  } = useAdvertisementForm(advertisementData, action);

  const handleSave = async () => {
    if (!validateForm() || !session?.api_session) {
      return;
    }

    setLoadingSave(true);
    showFullScreenLoading();

    try {
      const requestData = buildRequestData();
      let result;

      if (action === ContentAction.CREATE) {
        result = await advertisementService.create(
          session.api_session.access_token,
          requestData
        );
      } else {
        result = await advertisementService.update(
          session.api_session.access_token,
          data._id,
          requestData
        );
      }

      if (result.success && result.data) {
        const actionText =
          action === ContentAction.CREATE ? "criado" : "atualizado";
        showToast(
          `${requestData.title || "Anúncio"} ${actionText} com sucesso!`,
          IToastType.SUCCESS
        );

        setData(result.data);

        if (onSuccess) {
          onSuccess(result.data);
        } else {
          router.push("/advertisements");
        }
      } else {
        showToast(result.error || "Operação falhou", IToastType.ERROR);
      }
    } finally {
      setLoadingSave(false);
      hideFullScreenLoading();
    }
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900">
      <AdvertisementForm data={data} onUpdate={handleUpdate} action={action} />
      <div className="flex items-center justify-end w-full gap-3 bg-white dark:bg-gray-900 px-6 py-6 border-t">
        <Button size="sm" variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
        {loadingSave ? (
          <Spinner color="#465fff" />
        ) : (
          <Button size="sm" onClick={handleSave}>
            Salvar
          </Button>
        )}
      </div>
    </div>
  );
}
