import { Tabs } from "@/components/ui/tabs/Principal";
import React from "react";
import AdvertisementModalLocal from "./AdvertisementModalLocal";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { AdvertisementFormProps } from "./interface";
import { AdvertisementComponent } from "./AdvertisementModalItems";
import { AdvertisementMetricsTab } from "./Metrics/Tab";
import DisplaysTable from "@/components/displays/DisplaysTable";

enum InternalTabs {
  ADS = "ADS",
  DISPLAYS = "DISPLAYS",
  METRICS = "METRICS",
  LOCAL = "LOCAL",
}

const AdvertisementModalTab: React.FC<AdvertisementFormProps> = ({
  action,
  data,
  onUpdate,
}: AdvertisementFormProps) => {
  const tabs = [
    {
      id: InternalTabs.ADS,
      label: "Anúncio",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <div className="text-black dark:text-white text-center">
            <div className="justify-center w-full text-center mt-5">
              <AdvertisementComponent data={data} onUpdate={onUpdate} />
            </div>
          </div>
          <div>
            <AdvertisementModalAbout
              action={action}
              data={data}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      ),
    },
    {
      id: InternalTabs.LOCAL,
      label: `Estabelecimentos`,
      content: (
        <>
          {
            <AdvertisementModalLocal
              action={action}
              data={data}
              onUpdate={onUpdate}
            />
          }
        </>
      ),
    },
    ...(data?._id
      ? [
          {
            id: InternalTabs.METRICS,
            label: "Métricas",
            content: <AdvertisementMetricsTab id={data._id} />,
          },
          {
            id: InternalTabs.DISPLAYS,
            label: "Exibições",
            content: (
              <DisplaysTable
                internalQuery={{
                  advertisement: [data._id],
                }}
                className="mx-5 mt-2"
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Tabs
        tabs={tabs}
        defaultTabId={InternalTabs.ADS}
        styles={{
          nav: "p-0",
          navMenu: "mx-auto",
        }}
      />
    </div>
  );
};

export default AdvertisementModalTab;
