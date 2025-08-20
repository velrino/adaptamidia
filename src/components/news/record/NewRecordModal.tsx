"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

import { IApiNewsResponseItem } from "@/backend/api/api.interface";
import NewRecord from "./NewRecord";

interface INewRecordModalProps {
  record?: IApiNewsResponseItem | null;
  isCreateMode?: boolean;
  setOpen?: (open: boolean) => void;
  refresh: (open: boolean) => void;
  onCloseCallback: (record?: IApiNewsResponseItem) => void;
}

export default function NewRecordModal({
  record,
  isCreateMode = false,
  onCloseCallback,
}: INewRecordModalProps) {
  // const { data: session } = useSession();
  // const { showToast } = useToast();

  const handleClose = (data?: IApiNewsResponseItem) => {
    if (onCloseCallback) {
      onCloseCallback(data);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      showCloseButton={true}
      isFullscreen={true}
    >
      <NewRecord recordInformed={record} isCreateMode={isCreateMode} />
    </Modal>
  );
}
