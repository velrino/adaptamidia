"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

import { IApiDisplayLogItem } from "@/backend/api/api.interface";
import DisplayLogModalInfo from "./DisplayLogModalInfo";

interface IDisplayLogModalProps {
  record: IApiDisplayLogItem;
  setOpen?: (open: boolean) => void;
  refresh: (open: boolean) => void;
  onCloseCallback: (record?: IApiDisplayLogItem) => void;
}

export default function DisplayLogModal({
  record,
  onCloseCallback,
}: IDisplayLogModalProps) {
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
      isFullscreen={true}
      className="relative bg-white dark:bg-gray-900"
    >
      <div className="h-[100dvh] overflow-y-auto px-4 sm:px-6 pb-24 pt-6">
        <div className="mx-auto max-w-[1600px]">
          <DisplayLogModalInfo recordInformed={record} />
        </div>
      </div>
    </Modal>
  );
}
