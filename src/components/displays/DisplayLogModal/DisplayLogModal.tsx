"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

// import { useToast } from "@/context/ToastContext";
import { IApiDisplayLogItem } from "@/backend/api/api.interface";
// import { useSession } from "next-auth/react";
import DisplayLogModalInfo from "./DisplayLogModalInfo";

interface IDisplayLogModalProps {
  record: IApiDisplayLogItem;
  setOpen?: (open: boolean) => void;
  refresh: (open: boolean) => void;
  onCloseCallback: (record?: IApiDisplayLogItem) => void;
}

export enum DisplayLogModalTabs {
  INFO = "INFO",
  METRICS = "METRICS",
  POPULAR_TIMES = "POPULAR_TIMES",
}

export default function DisplayLogModal({
  record,
  onCloseCallback,
}: IDisplayLogModalProps) {
  // const { data: session } = useSession();
  // const { showToast } = useToast();

  const handleClose = (data?: IApiDisplayLogItem) => {
    if (onCloseCallback) {
      onCloseCallback(data);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      showCloseButton={true}
      className="max-w-[1200px] max-h-[90vh] overflow-y-auto"
    >
      <div className="px-6 pb-24">
        <div className="mx-auto">
          <DisplayLogModalInfo recordInformed={record} />
        </div>
      </div>
    </Modal>
  );
}
