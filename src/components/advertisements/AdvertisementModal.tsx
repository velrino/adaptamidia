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
    console.clear();
    console.log({ principal: result });
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      showCloseButton={false}
      isFullscreen={true}
      className="min-w-[100vw] max-w-[100vw] min-h-[100vh] p-6 lg:p-10 flex flex-col rounded-none"
    >
      <div className="fixed top-0 left-0 flex flex-col justify-between w-full h-screen p-6 overflow-x-hidden overflow-y-hidden bg-white dark:bg-gray-900 lg:p-10">
        {/* HEADER CONTENT */}
        <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
          {action === ContentAction.CREATE && "Criar Anúncio"}
          {action === ContentAction.UPDATE && "Editar Anúncio"}
        </h4>
        {/* END CONTENT */}

        {/* START CONTENT */}
        <div className="flex-grow overflow-y-hidden overflow-x-hidden min-h-[70vh] max-h-[70vh]">
          {record && (
            <AdvertisementModalTab
              action={action}
              data={record}
              onCallback={callback}
            />
          )}
        </div>
        {/* END CONTENT */}

        {/* START FOOTER */}
        <div>
          <div className="flex items-center justify-center w-full gap-3 mt-8">
            <Button size="sm" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleClose}>
              Salvar
            </Button>
          </div>
        </div>
        {/* END FOOTER */}
      </div>
    </Modal>
  );
}
