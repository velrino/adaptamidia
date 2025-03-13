import { IApiUnitItemResponse } from "@/backend/api/api.interface";
import { ChevronDownIcon } from "@/icons";
import React from "react";

interface FaqOneProps {
  title: string;
  content: IApiUnitItemResponse[];
  isOpen: boolean;
  toggleAccordion: () => void; // Function to toggle the open state
}

const AdvertisementModalUnits: React.FC<FaqOneProps> = ({
  title,
  content,
  isOpen,
  toggleAccordion,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Accordion Header */}
      <div
        onClick={toggleAccordion}
        className={`flex cursor-pointer items-center justify-between py-1 pl-6 pr-3 ${
          isOpen ? "bg-gray-50 dark:bg-white/[0.03]" : ""
        }`}
      >
        <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <button
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 duration-200 transition-transform ease-linear dark:bg-white/[0.03] ${
            isOpen
              ? "text-gray-800 dark:text-white/90 rotate-180"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <ChevronDownIcon />
        </button>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-2">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {content.map((unit) => (
              <div
                key={unit._id}
                className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {unit.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  📍 {unit.full_address}
                </p>

                <div className="mt-3 flex flex-col gap-1 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Dispositivos:
                    <span className="font-medium">
                      {Object.values(unit.devices).reduce(
                        (total, num) => total + num,
                        0
                      )}
                    </span>
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Tipo: <span className="font-medium">{unit.type}</span>
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Capacidade Máx.:
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
        </div>
      )}
    </div>
  );
};

export default AdvertisementModalUnits;
