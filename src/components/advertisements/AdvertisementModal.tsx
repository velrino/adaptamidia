"use client";

import React, { useState } from "react";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { ContentAction, IToastType } from "@/interfaces/general";
import AdvertisementModalTab from "./AdvertisementModal/AdvertisementModalTab";
import { useToast } from "@/context/ToastContext";

interface IAdvertisementModalProps {
  action: ContentAction;
  advertisementData: IApiAdvertisementItem;
  setOpen?: (open: boolean) => void;
  onCloseCallback: () => void;
}

export default function AdvertisementModal({
  action,
  advertisementData,
  onCloseCallback,
}: IAdvertisementModalProps) {
  const { showToast } = useToast();

  const handleClose = () => {
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  const [data, setData] = useState<IApiAdvertisementItem>(advertisementData);
  // const [companySelected, setCompanySelected] = useState<string | null>(
  //   // advertisementData.company?._id
  //   advertisementData?.company
  // );

  const handleUpdate = (updatedData: Partial<IApiAdvertisementItem>) => {
    setData((prev) => ({ ...prev, ...updatedData }));
  };

  const validateForm = () => {
    if (!data.company) {
      showToast("Escolha um Anunciante!", IToastType.ERROR);
      return true;
    }

    if (action === ContentAction.CREATE) {
      // const requiredFields: (keyof IApiAdvertisementItem)[] = [
      //   "type",
      // ];
      // if (requiredFields.some((field) => !data[field])) {
      //   return true;
      // }
      // return Object.values(formReport).every(Boolean);
    }
  };

  const save = () => {
    console.clear();
    console.log({ action, data });

    if (validateForm()) {
      return;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      showCloseButton={false}
      isFullscreen={true}
    >
      <div className="fixed top-0 left-0 flex flex-col w-full h-screen overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 p-0">
        <div className="flex-grow">
          <div className="font-semibold text-gray-800 m-0 text-title-sm dark:text-white/90 px-5 py-2">
            {`${action === ContentAction.CREATE ? "Criar" : "Editar"} ${
              data.title || "Anúncio"
            }`}
          </div>
          <div>
            <AdvertisementModalTab data={data} onUpdate={handleUpdate} />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-end w-full gap-3 bg-white dark:bg-gray-900 px-6 pb-6">
          <Button size="sm" variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <Button size="sm" onClick={save}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
