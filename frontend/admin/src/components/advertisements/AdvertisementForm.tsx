import React from "react";
import { AdvertisementFormProps } from "./AdvertisementModal/interface";
import AdvertisementModalTab from "./AdvertisementModal/AdvertisementModalTab";
import { ContentAction } from "@/interfaces/general";

export default function AdvertisementForm({ data, onUpdate, action }: AdvertisementFormProps) {
  if (!data) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex flex-col w-full h-full overflow-x-hidden overflow-y-auto">
      <div className="flex-grow">
        <div className="font-semibold text-gray-800 m-0 text-title-sm dark:text-white/90 px-5 py-2">
          {`${action === ContentAction.CREATE ? "Criar" : "Editar"} ${
            data.title || "Anúncio"
          }`}
        </div>
        <div>
          <AdvertisementModalTab
            data={data}
            onUpdate={onUpdate}
            action={action}
          />
        </div>
      </div>
    </div>
  );
}