"use client";

import React, { useState } from "react";
import { ContentAction, IToastType } from "@/interfaces/general";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

import {
  CompanyUnitDefaultFormReport,
  ICompanyUnitDefaultFormReport,
} from "./interface";
import { useToast } from "@/context/ToastContext";
import {
  IApiCreateCompanyUnitRequest,
  IApiUnitItemResponse,
  IApiUpdateCompanyUnitRequest,
} from "@/backend/api/api.interface";
import { CompanyUnitModalForm } from "./Form/CompanyUnitModalForm";

interface ICompanyUnitModalProps {
  action: ContentAction;
  record: IApiUnitItemResponse;
  setOpen?: (open: boolean) => void;
  onCloseCallback: () => void;
}

export default function CompanyUnitModal({
  action,
  record,
  onCloseCallback,
}: ICompanyUnitModalProps) {
  const handleClose = () => {
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  const { showToast } = useToast();

  const [data, setData] = useState<IApiUnitItemResponse>(record);

  const [formReport, setFormReport] = useState<ICompanyUnitDefaultFormReport>(
    CompanyUnitDefaultFormReport
  );

  const handleUpdate = (updatedData: Partial<IApiUnitItemResponse>) => {
    setData((prev) => ({ ...prev, ...updatedData }));
  };

  const validateForm = () => {
    if (action === ContentAction.CREATE) {
      const requiredFields: (keyof IApiUnitItemResponse)[] = [
        "type",
        "name",
        "status",
        "address",
        "company",
      ];

      if (requiredFields.some((field) => !data[field])) {
        return true;
      }

      return Object.values(formReport).every(Boolean);
    }
  };

  const saveForm = () => {
    if (validateForm()) {
      showToast("Preencha o formulário corretamente!", IToastType.ERROR);
      return;
    }

    if (action === ContentAction.CREATE) {
      const body: IApiCreateCompanyUnitRequest = {
        address: data.full_address,
        type: data.type,
        name: data.name,
        complement: data.complement,
        company_id: data.company,
      };
      console.log({ action, body });
    } else if (action === ContentAction.UPDATE && data._id) {
      const companyUnitId = data._id;
      const body: IApiUpdateCompanyUnitRequest = {
        company: data.company,
        complement: data.complement,
        name: data.name,
        full_address: data.full_address,
        neighborhood: data.neighborhood,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        street_number: data.street_number,
        type: data.type,
        status: data.status,
        devices: {
          smart_tv: data.devices.smart_tv,
        },
        prices: data.prices,
        max_capacity: data.max_capacity,
        location: data.location,
      };

      console.log({ action, companyUnitId, body });
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
              data.name || "Unidade"
            }`}
          </div>

          <div>
            <CompanyUnitModalForm
              action={action}
              data={data}
              onUpdate={handleUpdate}
              formReport={formReport}
              setFormReport={setFormReport}
            />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-end w-full gap-3 bg-white dark:bg-gray-900 px-6 pb-6">
          <Button size="sm" variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <Button size="sm" onClick={saveForm}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
