"use client";

import React, { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import AdvertisementModalTab from "./AdvertisementModal/AdvertisementModalTab";
import { ContentAction } from "@/interfaces/general";

interface AdvertisementModalProps {
  action: ContentAction;
  data?: IApiAdvertisementItem;
  setOpen?: (open: boolean) => void;
  onCloseCallback?: () => void;
}

export default function AdvertisementModal({
  action,
  data,
  onCloseCallback,
}: AdvertisementModalProps) {
  const handleClose = () => {
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  const [record, setRecord] = useState<IApiAdvertisementItem>();

  useEffect(() => {
    console.log({ data });
    setRecord(() => data);
  }, [data]);

  const callback = (result: IApiAdvertisementItem) => {
    // console.clear();
    console.log({ principal: result });
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      showCloseButton={false}
      isFullscreen={true}
      className="min-w-[100vw] max-w-[100vw] min-h-[100vh] p-6 lg:p-10 rounded-none"
    >
      <div className="fixed top-0 left-0  justify-between w-full h-screen overflow-x-hidden overflow-y-hidden bg-white dark:bg-gray-900">
        {/* HEADER CONTENT */}
        <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm px-5 pt-5">
          {action === ContentAction.CREATE && "Criar Anúncio"}
          {action === ContentAction.UPDATE && "Editar Anúncio"}
        </h4>
        {/* END CONTENT */}

        {/* START CONTENT */}
        <div>
          {record && (
            <AdvertisementModalTab
              action={action}
              data={record}
              onCallback={callback}
            />
          )}
        </div>
        <div className="w-full flex justify-center">
          <div className="flex gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleClose}>
              Salvar
            </Button>
          </div>
        </div>

        {/* END CONTENT */}
      </div>
    </Modal>
  );
}
