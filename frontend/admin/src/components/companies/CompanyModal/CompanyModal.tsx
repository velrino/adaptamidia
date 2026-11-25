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
import { GetErrorMessage } from "@/utils/generic";
import { API } from "@/backend/api/api.endpoints";
import { useSession } from "next-auth/react";
import Spinner from "@/components/ui/spinner/Spinner";

interface ICompanyModalProps {
  action: ContentAction;
  record: IApiCompanyResponse;
  setOpen?: (open: boolean) => void;
  refresh: (refresh: boolean) => void;
  onCloseCallback: () => void;
}

export default function CompanyModal({
  action,
  record,
  refresh,
  onCloseCallback,
}: ICompanyModalProps) {
  const { data: session } = useSession();

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

  const [loadingSave, setLoadingSave] = useState(false);
  const save = async () => {
    if (validateForm()) {
      showToast("Preencha o formulário corretamente!", IToastType.ERROR);
      return;
    }

    setLoadingSave(true);

    if (action === ContentAction.CREATE) {
      await createCompany({
        document_type: data.document_type,
        document: data.document,
        type: data.type,
        name: data.name,
        status: data.status,
      }).finally(() => {
        setLoadingSave(false);
      });
    } else if (action === ContentAction.UPDATE && data._id) {
      const companyId = data._id;
      await updateCompany(companyId, {
        document_type: data.document_type,
        document: data.document,
        type: data.type,
        name: data.name,
        status: data.status,
      }).finally(() => {
        setLoadingSave(false);
      });
    }
  };

  const createCompany = async (body: IApiCreateCompanyRequest) => {
    if (!session?.api_session) {
      return;
    }

    try {
      const response = await API.companies.create(
        session.api_session.access_token,
        body
      );

      const data = await response.json();

      if (data?.error && data?.message) {
        showToast(GetErrorMessage(data.message), IToastType.ERROR);
      } else if (response.ok) {
        showToast(`${body.name} salvo com sucesso!`, IToastType.SUCCESS);
        refresh(true);
        onCloseCallback();
      }
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    }
  };

  const updateCompany = async (id: string, body: IApiUpdateCompanyRequest) => {
    if (!session?.api_session) {
      return;
    }

    try {
      const response = await API.companies.update(
        session.api_session.access_token,
        id,
        body
      );

      const data = await response.json();

      if (data?.error && data?.message) {
        showToast(GetErrorMessage(data.message), IToastType.ERROR);
      } else if (response.ok) {
        showToast(`${body.name} atualizado com sucesso!`, IToastType.SUCCESS);
      }
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCloseCallback}
      showCloseButton={false}
      isFullscreen={true}
    >
      <div className="fixed top-0 left-0 flex flex-col w-full h-screen overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 p-0">
        <div className="flex-grow">
          <div className="font-semibold text-gray-800 m-0 text-title-sm dark:text-white/90 px-5 py-2">
            {`${action === ContentAction.CREATE ? "Criar" : "Editar"} ${
              data.name || "Empresa"
            }`}
          </div>
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
          <Button size="sm" variant="outline" onClick={onCloseCallback}>
            Fechar
          </Button>

          {loadingSave ? (
            <Spinner color="#465fff" />
          ) : (
            <Button size="sm" onClick={save}>
              Salvar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
