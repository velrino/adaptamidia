import { Tabs } from "@/components/ui/tabs/Principal";
import React from "react";
import AdvertisementModalLocal from "./AdvertisementModalLocal";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { AdvertisementFormProps } from "./interface";
import { AdvertisementComponent } from "./AdvertisementModalItems";
import { AdvertisementMetricsTab } from "./Metrics/Tab";
import DisplaysTable from "@/components/displays/DisplaysTable";

const AdvertisementModalTab: React.FC<AdvertisementFormProps> = ({
  action,
  data,
  onUpdate,
}: AdvertisementFormProps) => {
  const tabs = [
    {
      id: "ADS",
      label: "Anúncio",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <div className="text-black dark:text-white text-center">
            {/* {data._id && (
              <div className="cursor-pointer">
                <div className="h-10 cursor-pointer" onClick={openPreview}>
                  Abrir no Display
                </div>
              </div>
            )}
            {!data._id && (
              <div>
                <div className="h-10">Salve para ver no Display</div>
              </div>
            )} */}
            {/* <div className="flex justify-center w-full gap-4">
              <div className="w-full max-w-[640px]">
                <div
                  className="relative w-full bg-black rounded-lg"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  {data.source_landscape ? (
                    <video
                      src={data.source_landscape}
                      controls
                      playsInline
                      className="absolute inset-0 w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      Sem vídeo landscape
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full max-w-[360px]">
                <div
                  className="relative w-full bg-black rounded-lg overflow-hidden"
                  style={{ aspectRatio: "9 / 16" }}
                >
                  {data.source_portrait ? (
                    <video
                      src={data.source_portrait}
                      controls
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      Sem vídeo portrait
                    </div>
                  )}
                </div>
              </div>
            </div> */}
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
      id: "LOCAL",
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
            id: "METRICS",
            label: "Métricas",
            content: <AdvertisementMetricsTab id={data._id} />,
          },
          {
            id: "DISPLAYS",
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
        defaultTabId="ADS"
        styles={{
          nav: "p-0",
          navMenu: "mx-auto",
        }}
      />
    </div>
  );
};

export default AdvertisementModalTab;
