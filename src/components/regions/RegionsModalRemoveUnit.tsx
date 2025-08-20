import { IApiUnitItemResponse } from "@/backend/api/api.interface";
import React from "react";
import { Modal } from "@/components/ui/modal";
import { IUseModal } from "@/hooks/useModal";
import Button from "@/components/ui/button/Button";

interface IRegionsModalRemoveUnit {
  selected: IApiUnitItemResponse;
  currentModal: IUseModal;
  callback: (item: IApiUnitItemResponse) => void;
}

const RegionsModalRemoveUnit: React.FC<IRegionsModalRemoveUnit> = ({
  selected,
  currentModal,
  callback,
}) => {
  const removeSelected = () => {
    callback(selected);
  };

  return (
    <>
      {selected && (
        <Modal
          isOpen={currentModal.isOpen}
          onClose={currentModal.closeModal}
          className="max-w-[700px] m-4"
        >
          <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl  text-gray-800 dark:text-white/90">
                Deseja remover{" "}
                <span className="font-semibold">{selected.name}</span> da lista
                de estabelecimentos?
              </h4>
              <p className="mb-6 text-md text-gray-500 dark:text-gray-400 lg:mb-7">
                Você está prestes a remover {selected.name} da lista de
                estabelecimentos que exibem seu anúncio.
              </p>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={currentModal.closeModal}
              >
                Não
              </Button>
              <Button size="sm" onClick={removeSelected}>
                Sim
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default RegionsModalRemoveUnit;
