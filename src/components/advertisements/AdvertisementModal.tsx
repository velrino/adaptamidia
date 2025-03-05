"use client";

import React, { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";

interface AdvertisementModalProps {
  data?: IApiAdvertisementItem;
  setOpen?: (open: boolean) => void;
  onCloseCallback?: () => void;
}

export default function AdvertisementModal({
  data,
  onCloseCallback,
}: AdvertisementModalProps) {
  const handleClose = () => {
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  const [record, setRecord] = useState<IApiAdvertisementItem>();

  useEffect(() => {
    console.log({ data });
    setRecord(() => data);
  }, [data]);

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      showCloseButton={false}
      className="max-w-[507px] p-6 lg:p-10"
    >
      <div className="text-center">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
          Modal
        </h4>
        <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
          {record?.title}
        </p>

        <div className="flex items-center justify-center w-full gap-3 mt-8">
          <Button size="sm" variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button size="sm" onClick={handleClose}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
