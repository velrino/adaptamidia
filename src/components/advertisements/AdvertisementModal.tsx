"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import {
  IApiAdvertisementItem,
  IApiCreateAdvertisementRequest,
  IApiUpdateAdvertisementRequest,
} from "@/backend/api/api.interface";
import { ContentAction, IToastType } from "@/interfaces/general";
import AdvertisementModalTab from "./AdvertisementModal/AdvertisementModalTab";
import { useToast } from "@/context/ToastContext";
import { useSession } from "next-auth/react";
import { API } from "@/backend/api/api.endpoints";
import { GetErrorMessage } from "@/utils/generic";
import { useLoading } from "@/context/LoadingContext";
import Spinner from "../ui/spinner/Spinner";

interface IAdvertisementModalProps {
  action: ContentAction;
  advertisementData: IApiAdvertisementItem;
  setContentAction: Dispatch<SetStateAction<ContentAction>>;
  setOpen?: (open: boolean) => void;
  refresh: (refresh: boolean) => void;
  onCloseCallback: () => void;
}

export default function AdvertisementModal({
  action,
  advertisementData,
  onCloseCallback,
  setContentAction,
  refresh,
}: IAdvertisementModalProps) {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const { showFullScreenLoading, hideFullScreenLoading } = useLoading();

  const handleClose = () => {
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  const [data, setData] = useState<IApiAdvertisementItem>(advertisementData);

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

  const [loadingSave, setLoadingSave] = useState(false);
  const save = async () => {
    console.clear();

    if (validateForm()) {
      return;
    }

    setLoadingSave(true);
    if (action === ContentAction.CREATE) {
      await create({
        company: data.company._id,
        title: data.title,
        description: data.description,
        type: data.type,
        items: data.items,
        seconds: data.seconds,
        status: data.status,
        neighborhood: data.neighborhood,
        audience: data.audience,
        segments: data.segments,
        units: data.units,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
      }).finally(() => setLoadingSave(false));
    } else if (action === ContentAction.UPDATE) {
      await update({
        company: data.company._id,
        title: data.title,
        description: data.description,
        type: data.type,
        items: data.items,
        seconds: data.seconds,
        status: data.status,
        neighborhood: data.neighborhood,
        audience: data.audience,
        segments: data.segments,
        units: data.units,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
      }).finally(() => setLoadingSave(false));
    }
  };

  const create = async (body: IApiCreateAdvertisementRequest) => {
    if (!session?.api_session) {
      return;
    }

    try {
      showFullScreenLoading();
      const response = await API.advertisement.create(
        session.api_session.access_token,
        body
      );

      const currentData = await response.json();

      if (currentData?.error && currentData?.message) {
        showToast(GetErrorMessage(currentData.message), IToastType.ERROR);
      } else if (response.ok && currentData?._id) {
        showToast(
          `${body.title || "Anúncio"} criado com sucesso!`,
          IToastType.SUCCESS
        );

        setData(currentData);
        setContentAction(ContentAction.UPDATE);
        refresh(true);
      } else {
        showToast("FAILED", IToastType.ERROR);
      }
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    } finally {
      hideFullScreenLoading();
    }
  };

  const update = async (body: IApiUpdateAdvertisementRequest) => {
    if (!session?.api_session) {
      return;
    }

    try {
      showFullScreenLoading();
      const response = await API.advertisement.update(
        session.api_session.access_token,
        data._id,
        body
      );

      const currentData = await response.json();

      if (currentData?.error && currentData?.message) {
        showToast(GetErrorMessage(currentData.message), IToastType.ERROR);
      } else if (response.ok && currentData?._id) {
        showToast(
          `${body.title || "Anúncio"} atualizado com sucesso!`,
          IToastType.SUCCESS
        );

        setData(currentData);
        setContentAction(ContentAction.UPDATE);
        refresh(true);
      } else {
        showToast("FAILED", IToastType.ERROR);
      }
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    } finally {
      hideFullScreenLoading();
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
            <AdvertisementModalTab
              data={data}
              onUpdate={handleUpdate}
              action={action}
            />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-end w-full gap-3 bg-white dark:bg-gray-900 px-6 pb-6">
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
