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
      className="min-w-[95vw] max-w-[95vw] min-h-[95vh] p-6 lg:p-10 flex flex-col"
    >
      {/* HEADER CONTENT */}
      <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
        {action === ContentAction.CREATE && "Criar Anúncio"}
        {action === ContentAction.UPDATE && "Editar Anúncio"}
      </h4>
      {/* END CONTENT */}

      {/* START CONTENT */}
      <div className="flex-grow overflow-y-auto overflow-x-hidden min-h-[75vh] max-h-[75vh]">
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
    </Modal>
  );
}
