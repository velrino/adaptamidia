"use client";

import React, { useState } from "react";
import { ContentAction, IToastType } from "@/interfaces/general";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import {
  IApiCompanyResponse,
  IApiCreateCompanyRequest,
  IApiUpdateCompanyRequest,
} from "@/backend/api/api.interface";
import { CompanyModalForm } from "./Form/CompanyModalForm";
import {
  CompanyDefaultFormReport,
  ICompanyDefaultFormReport,
} from "./interface";
import { useToast } from "@/context/ToastContext";

interface ICompanyModalProps {
  action: ContentAction;
  record: IApiCompanyResponse;
  setOpen?: (open: boolean) => void;
  onCloseCallback: () => void;
}

export default function CompanyModal({
  action,
  record,
  onCloseCallback,
}: ICompanyModalProps) {
  const handleClose = () => {
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  const { showToast } = useToast();

  const [data, setData] = useState<IApiCompanyResponse>(record);

  const [formReport, setFormReport] = useState<ICompanyDefaultFormReport>(
    CompanyDefaultFormReport
  );

  const handleUpdate = (updatedData: Partial<IApiCompanyResponse>) => {
    setData((prev) => ({ ...prev, ...updatedData }));
  };

  const validateForm = () => {
    const requiredFields: (keyof IApiCompanyResponse)[] = [
      "document",
      "name",
      "status",
      "document_type",
    ];

    if (requiredFields.some((field) => !data[field])) {
      return true;
    }

    return Object.values(formReport).every(Boolean);
  };

  const save = () => {
    console.clear();

    if (validateForm()) {
      showToast("Preencha o formulário corretamente!", IToastType.ERROR);
      return;
    }

    if (action === ContentAction.CREATE) {
      const body: IApiCreateCompanyRequest = {
        document_type: data.document_type,
        document: data.document,
        type: data.type,
        name: data.name,
        status: data.status,
      };
      console.log({ action, body });
    } else if (action === ContentAction.UPDATE && data._id) {
      const companyId = data._id;
      const body: IApiUpdateCompanyRequest = {
        document_type: data.document_type,
        document: data.document,
        type: data.type,
        name: data.name,
        status: data.status,
      };

      console.log({ action, companyId, body });
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
          <h4 className="font-semibold text-gray-800 m-0 text-title-sm dark:text-white/90 px-5 py-2">
            {action === ContentAction.CREATE && "Criar Empresa"}
            {action === ContentAction.UPDATE && "Editar Empresa"}
          </h4>
          <div>
            <CompanyModalForm
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
          <Button size="sm" onClick={save}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
