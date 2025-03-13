import { IApiUnitItemResponse } from "@/backend/api/api.interface";
import Accordion from "@/components/ui/accordion/Accordion";
import React, { useState, useMemo, useEffect } from "react";
import { SumAllDevices } from "./helper";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { useModal } from "@/hooks/useModal";
import AdvertisementModalRemoveUnit from "./AdvertisementModalUnits/AdvertisementModalRemoveUnit";
import {
  EnumAdvertisementModalUnit,
  IAdvertisementModalUnitCallback,
} from "./AdvertisementModalUnits/interface";

interface IAdvertisementModalUnits {
  title: string;
  content: IApiUnitItemResponse[];
  isOpen: boolean;
  toggleAccordion: () => void;
  callback: (item: IAdvertisementModalUnitCallback) => void;
}

const AdvertisementModalUnits: React.FC<IAdvertisementModalUnits> = ({
  title,
  content,
  isOpen,
  toggleAccordion,
  callback,
}) => {
  // State to control the open/close state of each neighborhood
  const [openNeighborhoods, setOpenNeighborhoods] = useState<
    Record<string, boolean>
  >({});

  // Function to toggle the visibility of a neighborhood
  const toggleNeighborhood = (neighborhood: string) => {
    setOpenNeighborhoods((prev) => ({
      ...prev,
      [neighborhood]: !prev[neighborhood],
    }));
  };

  // Group units by neighborhood using useMemo for optimization
  const groupedUnits = useMemo(() => {
    return content.reduce((acc, unit) => {
      const neighborhood = unit.neighborhood || "Unknown"; // Fallback for units without a neighborhood
      if (!acc[neighborhood]) {
        acc[neighborhood] = [];
      }
      acc[neighborhood].push(unit);
      return acc;
    }, {} as Record<string, IApiUnitItemResponse[]>);
  }, [content]);

  const modalRemoteUnit = useModal();
  const [selected, setSelected] = useState<IApiUnitItemResponse | null>();

  const advertisementModalRemoveUnitCallback = (
    current: IApiUnitItemResponse
  ) => {
    callback({
      type: EnumAdvertisementModalUnit.REMOVE_UNIT,
      data: current,
    });
    modalRemoteUnit.closeModal();
  };

  // useEffect(() => {
  //   setSelected(() => content[0]);
  //   modalRemoteUnit.openModal();
  // }, [content]);

  return (
    <>
      <Accordion
        title={title}
        isOpen={isOpen}
        toggleAccordion={toggleAccordion}
        style={{
          content: "p-0",
        }}
      >
        <div className="p-0 m-0">
          {Object.entries(groupedUnits).map(([neighborhood, units]) => (
            <Accordion
              key={neighborhood}
              title={`| ${neighborhood} (${units.length}) - ${SumAllDevices(
                units
              )} Telas`}
              // isOpen={true}
              isOpen={openNeighborhoods[neighborhood] || false} // Controls the open/close state
              toggleAccordion={() => toggleNeighborhood(neighborhood)} // Toggles the state
              style={{
                principal: "rounded-none",
                content: "px-1 py-2",
              }}
            >
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {units.map((unit) => (
                  <div
                    key={unit._id}
                    className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-md font-semibold text-gray-900 dark:text-white truncate">
                        {unit.name}
                      </div>
                      <div
                        className="cursor-pointer flex-shrink-0"
                        onClick={() => {
                          setSelected(unit);
                          modalRemoteUnit.openModal();
                        }}
                      >
                        <IoMdCloseCircleOutline
                          size={25}
                          className="text-brand-500"
                        />
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      📍 {unit.full_address}
                    </p>

                    <div className="mt-3 flex flex-col gap-1 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Devices:
                        <span className="font-medium">
                          {Object.values(unit.devices).reduce(
                            (total, num) => total + num,
                            0
                          )}
                        </span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Type: <span className="font-medium">{unit.type}</span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Max Capacity:
                        <span className="font-medium">{unit.max_capacity}</span>
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        🏢 {unit.company}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Accordion>
          ))}
        </div>
      </Accordion>

      {selected && (
        <AdvertisementModalRemoveUnit
          selected={selected}
          callback={advertisementModalRemoveUnitCallback}
          currentModal={modalRemoteUnit}
          key={"AdvertisementModalRemoveUnit"}
        />
      )}
    </>
  );
};

export default AdvertisementModalUnits;
