"use client";

import React, { useState } from "react";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useToast } from "@/context/ToastContext";
import { useSession } from "next-auth/react";
import { useLoading } from "@/context/LoadingContext";
import Spinner from "../ui/spinner/Spinner";
import { IUseModal } from "@/hooks/useModal";
import StudioComponent from "./Studio";

interface IStudioModal {
  currentModal: IUseModal;
  //   callback: () => void;
}

export default function StudioModal({ currentModal }: IStudioModal) {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const { showFullScreenLoading, hideFullScreenLoading } = useLoading();

  const handleClose = () => {
    currentModal.closeModal();
  };

  const [loadingSave] = useState(false);

  return (
    <Modal
      isOpen={currentModal.isOpen}
      onClose={handleClose}
      showCloseButton={false}
      isFullscreen={true}
    >
      <div className="fixed top-0 left-0 flex flex-col w-full h-screen overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 p-0">
        <div className="flex-grow mb-20">
          {/* <div className="font-semibold text-gray-800 m-0 text-title-sm dark:text-white/90 px-5 py-2">
            TESTE
          </div>
          <div>
            <StudioComponent />
          </div> */}
          <StudioComponent />
        </div>

        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-end w-full gap-3 bg-white dark:bg-gray-900 px-6 pb-6">
          <Button size="sm" variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          {loadingSave ? (
            <Spinner color="#465fff" />
          ) : (
            <Button size="sm">Salvar</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
