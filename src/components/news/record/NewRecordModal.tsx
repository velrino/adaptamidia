"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

import { IApiNewsResponseItem } from "@/backend/api/api.interface";
import NewRecord from "./NewRecord";

interface INewRecordModalProps {
  record: IApiNewsResponseItem;
  setOpen?: (open: boolean) => void;
  refresh: (open: boolean) => void;
  onCloseCallback: (record?: IApiNewsResponseItem) => void;
}

export default function NewRecordModal({
  record,
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
      className="max-w-[1200px] max-h-[90vh] overflow-y-auto"
    >
      <div className="px-6 pb-24">
        <div className="mx-auto">
          {/* <DisplayLogModalInfo recordInformed={record} /> */}
          <NewRecord recordInformed={record} />
        </div>
      </div>
    </Modal>
  );
}
