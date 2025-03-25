"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
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
import { Tabs } from "@/components/ui/tabs/Principal";
// import { CompanyUnitModalPricesTable } from "./CompanyUnitModalPricesTable/CompanyUnitModalPricesTable";
import { CompanyUnitModalPopularTimes } from "./CompanyUnitModalPopularTimes/CompanyUnitModalPopularTimes";
import { API } from "@/backend/api/api.endpoints";
import { useSession } from "next-auth/react";
import { GetErrorMessage } from "@/utils/generic";
import Spinner from "@/components/ui/spinner/Spinner";

interface ICompanyUnitModalProps {
  action: ContentAction;
  setContentAction: Dispatch<SetStateAction<ContentAction>>;
  // setCurrentSelected: Dispatch<
  //   SetStateAction<IApiUnitItemResponse | null | undefined>
  // >;
  record: IApiUnitItemResponse;
  setOpen?: (open: boolean) => void;
  refresh: (open: boolean) => void;
  onCloseCallback: (record?: IApiUnitItemResponse) => void;
}

export enum CompanyUnitModalTabs {
  INFO = "INFO",
  // PRICES = "PRICES",
  POPULAR_TIMES = "POPULAR_TIMES",
}

export default function CompanyUnitModal({
  action,
  setContentAction,
  record,
  refresh,
  onCloseCallback,
}: ICompanyUnitModalProps) {
  const { data: session } = useSession();

  const handleClose = (data?: IApiUnitItemResponse) => {
    if (onCloseCallback) {
      onCloseCallback(data);
    }
  };

  const { showToast } = useToast();

  const [data, setData] = useState<IApiUnitItemResponse>(record);
  const [companySelected, setCompanySelected] = useState<string | null>(
    record.company?._id
  );

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
        "full_address",
      ];

      if (requiredFields.some((field) => !data[field]) || !companySelected) {
        return true;
      }

      return Object.values(formReport).every(Boolean);
    }
  };

  const [loadingSave, setLoadingSave] = useState(false);
  const save = async () => {
    if (validateForm()) {
      showToast("Preencha o formulário corretamente!", IToastType.ERROR);
      return;
    }

    setLoadingSave(true);
    if (action === ContentAction.CREATE && companySelected) {
      await create({
        address: data.full_address,
        type: data.type,
        name: data.name,
        complement: data.complement,
        company_id: companySelected,
        devices: {
          smart_tv: data.devices.smart_tv,
        },
        max_capacity: data.max_capacity,
      }).finally(() => setLoadingSave(false));
    } else if (action === ContentAction.UPDATE && data._id && companySelected) {
      console.log({
        action,
        prices: data.prices,
        popular_time: data.popular_time,
      });

      await update(data._id, {
        company_id: companySelected,
        complement: data.complement,
        name: data.name,
        full_address: data.full_address,
        type: data.type,
        status: data.status,
        devices: {
          smart_tv: data.devices.smart_tv,
        },
        max_capacity: data.max_capacity,
      }).finally(() => setLoadingSave(false));
    }
  };

  const create = async (body: IApiCreateCompanyUnitRequest) => {
    if (!session?.api_session) {
      return;
    }

    try {
      const response = await API.company_units.create(
        session.api_session.access_token,
        body
      );

      const currentData = await response.json();

      if (currentData?.error && currentData?.message) {
        showToast(GetErrorMessage(currentData.message), IToastType.ERROR);
      } else if (response.ok && currentData?._id) {
        showToast(`${body.name} salvo com sucesso!`, IToastType.SUCCESS);

        setData(currentData);
        setCompanySelected(currentData?.company?._id);
        setContentAction(ContentAction.UPDATE);
        refresh(true);
        // onCloseCallback();
      } else {
        showToast("FAILED", IToastType.ERROR);
      }
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    }
  };

  const update = async (id: string, body: IApiUpdateCompanyUnitRequest) => {
    if (!session?.api_session) {
      return;
    }

    try {
      const response = await API.company_units.update(
        session.api_session.access_token,
        id,
        body
      );

      const currentData = await response.json();

      if (currentData?.error && currentData?.message) {
        showToast(GetErrorMessage(currentData.message), IToastType.ERROR);
      } else if (response.ok && currentData?._id) {
        showToast(`${body.name} atualizado com sucesso!`, IToastType.SUCCESS);

        setData(currentData);
        setCompanySelected(currentData?.company?._id);
        setContentAction(ContentAction.UPDATE);
        refresh(true);
      } else {
        showToast("FAILED", IToastType.ERROR);
      }
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    }
  };

  const tabs = [
    {
      id: CompanyUnitModalTabs.INFO,
      label: "Info",
      content: (
        <CompanyUnitModalForm
          action={action}
          data={data}
          onUpdate={handleUpdate}
          formReport={formReport}
          setFormReport={setFormReport}
          formCompany={{ companySelected, setCompanySelected }}
        />
      ),
    },
    ...(action === ContentAction.UPDATE
      ? [
          // {
          //   id: CompanyUnitModalTabs.PRICES,
          //   label: "Preços",
          //   content: (
          //     <CompanyUnitModalPricesTable
          //       action={action}
          //       data={data}
          //       onUpdate={handleUpdate}
          //       formReport={formReport}
          //       setFormReport={setFormReport}
          //     />
          //   ),
          // },
          {
            id: CompanyUnitModalTabs.POPULAR_TIMES,
            label: "Horários",
            content: (
              <CompanyUnitModalPopularTimes
                action={action}
                data={data}
                onUpdate={handleUpdate}
                formReport={formReport}
                setFormReport={setFormReport}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      showCloseButton={false}
      isFullscreen={true}
    >
      <div className="fixed top-0 left-0 flex flex-col w-full h-screen overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 p-0">
        <div className="flex-grow mb-10 p-0 m-0">
          <div className="font-semibold text-gray-800 m-0 text-title-sm dark:text-white/90 px-5 py-2">
            {`${action === ContentAction.CREATE ? "Criar" : "Editar"} ${
              data.name || "Unidade"
            }`}
          </div>

          <div>
            <Tabs
              tabs={tabs}
              defaultTabId={CompanyUnitModalTabs.INFO}
              styles={{
                nav: "p-0",
                navMenu: "mx-auto",
              }}
            />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-end w-full gap-3 bg-white dark:bg-gray-900 px-6 pb-6 dark:border-white/[0.2] border-t-1 ">
          <Button size="sm" variant="outline" onClick={handleClose}>
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
