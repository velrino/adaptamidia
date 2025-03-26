import { IApiUnitItemResponse } from "@/backend/api/api.interface";
import Accordion from "@/components/ui/accordion/Accordion";
import React, { useState, useMemo, ReactNode } from "react";
import { SumAllDevices } from "./helper";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { useModal } from "@/hooks/useModal";
import AdvertisementModalRemoveUnit from "./AdvertisementModalUnits/AdvertisementModalRemoveUnit";
import {
  EnumAdvertisementModalUnit,
  IAdvertisementModalUnitCallback,
} from "./AdvertisementModalUnits/interface";
import Image from "next/image";
import { PiUsersLight, PiEye, PiDesktop } from "react-icons/pi";
import { AdPeriod } from "@/interfaces/ads";
import { BsCashCoin } from "react-icons/bs";
import { FormatCurrency, FormatThousand } from "@/utils/generic";
import { faker } from "@faker-js/faker";

interface IAdvertisementModalUnits {
  title: string;
  content: IApiUnitItemResponse[];
  seconds: number;
  isOpen: boolean;
  toggleAccordion: () => void;
  callback: (item: IAdvertisementModalUnitCallback) => void;
}

const UnitImageItem = ({ image }: { image: string }) => {
  const [currentImage, setCurrentImage] = useState(image);

  return (
    <Image
      src={currentImage}
      alt="Imagem do local"
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      className="rounded-l-lg object-cover object-center"
      onError={() => setCurrentImage("/images/local/1.jpg")}
    />
  );
};

const AdvertisementModalUnits: React.FC<IAdvertisementModalUnits> = ({
  title,
  content,
  isOpen,
  seconds,
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

  const groupedUnits = useMemo(() => {
    const grouped = content.reduce((acc, unit) => {
      const neighborhood = `${unit.city} - ${unit.neighborhood}` || "Unknown";
      if (!acc[neighborhood]) {
        acc[neighborhood] = [];
      }
      acc[neighborhood].push(unit);
      return acc;
    }, {} as Record<string, IApiUnitItemResponse[]>);

    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    );
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

  function MetricItem({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string | number;
    icon: ReactNode;
  }) {
    return (
      <div className="flex flex-col w-full items-s text-gray-600 dark:text-gray-300 border-l first:border-l-0 pl-3 first:pl-0">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-md font-bold">{value}</span>
        </div>
      </div>
    );
  }

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
              <div className="grid gap-2">
                {units.map((unit: IApiUnitItemResponse) => {
                  // const currentMetrics = {
                  //   [AdPeriod.DAILY]: unit.prices.find(
                  //     (price) =>
                  //       price.period === AdPeriod.DAILY &&
                  //       price.seconds === seconds
                  //   ),
                  //   [AdPeriod.WEEKLY]: unit.prices.find(
                  //     (price) =>
                  //       price.period === AdPeriod.WEEKLY &&
                  //       price.seconds === seconds
                  //   ),
                  //   [AdPeriod.MONTHLY]: unit.prices.find(
                  //     (price) =>
                  //       price.period === AdPeriod.MONTHLY &&
                  //       price.seconds === seconds
                  //   ),
                  // };
                  const dailyAverageVisitorsExample = faker.number.int({
                    min: 75,
                    max: 200,
                  });

                  return (
                    <div
                      key={unit._id}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="grid md:grid-cols-2 lg:grid-cols-12">
                        <div className="col-span-2 relative h-full w-full p-0">
                          <UnitImageItem image={unit.image} />
                        </div>
                        <div className="col-span-10 p-4">
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
                            {unit.full_address}
                          </p>

                          <div className="rounded-2xl w-full max-w-md mt-3">
                            <div className="flex gap-3">
                              <MetricItem
                                label={"Alcance diário"}
                                value={FormatThousand(
                                  dailyAverageVisitorsExample
                                )}
                                icon={<PiUsersLight size={15} />}
                              />

                              <MetricItem
                                label={"Alcance semanal"}
                                value={FormatThousand(
                                  dailyAverageVisitorsExample * 7
                                )}
                                icon={<PiUsersLight size={15} />}
                              />

                              <MetricItem
                                label={"Alcance Mensal"}
                                value={FormatThousand(
                                  dailyAverageVisitorsExample * 31
                                )}
                                icon={<PiUsersLight size={15} />}
                              />
                            </div>
                          </div>

                          <div className="rounded-2xl w-full max-w-md mt-3">
                            <div className="flex gap-3">
                              <MetricItem
                                label="Exibições"
                                value={FormatThousand(
                                  dailyAverageVisitorsExample * 42
                                )}
                                icon={<PiEye size={15} />}
                              />

                              <MetricItem
                                label="Telas"
                                value={Object.values(unit.devices).reduce(
                                  (total, num) => total + num,
                                  0
                                )}
                                icon={<PiDesktop size={15} />}
                              />

                              <MetricItem
                                label="Exibições"
                                value={FormatThousand(
                                  dailyAverageVisitorsExample * 29
                                )}
                                icon={<PiEye size={15} />}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
