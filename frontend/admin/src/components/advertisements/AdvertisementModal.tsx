"use client";

import React from "react";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { ContentAction, IToastType } from "@/interfaces/general";
import { AdvertisementModalProps } from "./AdvertisementModal/interface";
import { useAdvertisementForm } from "@/hooks/useAdvertisementForm";
import { advertisementService } from "@/services/advertisementService";
import AdvertisementForm from "./AdvertisementForm";
import Spinner from "../ui/spinner/Spinner";

export default function AdvertisementModal({
  action,
  data: advertisementData,
  onClose,
  onSuccess,
}: AdvertisementModalProps) {
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
        const actionText = action === ContentAction.CREATE ? "criado" : "atualizado";
        showToast(
          `${requestData.title || "Anúncio"} ${actionText} com sucesso!`,
          IToastType.SUCCESS
        );
        
        setData(result.data);
        onSuccess(result.data);
      } else {
        showToast(result.error || "Operação falhou", IToastType.ERROR);
      }
    } finally {
      setLoadingSave(false);
      hideFullScreenLoading();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      showCloseButton={false}
      isFullscreen={true}
    >
      <div className="fixed top-0 left-0 flex flex-col w-full h-screen overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 p-0">
        <AdvertisementForm
          data={data}
          onUpdate={handleUpdate}
          action={action}
        />
        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-end w-full gap-3 bg-white dark:bg-gray-900 px-6 pb-6">
          <Button size="sm" variant="outline" onClick={onClose}>
            Fechar
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
    </Modal>
  );
}
