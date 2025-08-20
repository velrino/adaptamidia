import { Tabs } from "@/components/ui/tabs/Principal";
import React, { useCallback, useEffect, useState } from "react";
import AdvertisementModalLocal from "./AdvertisementModalLocal";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { AdvertisementFormProps } from "./interface";
import { Display } from "../Ads/Display";
import { AdsCurrentType, DisplayThemes } from "@/interfaces/ads";
import { AdvertisementComponent } from "./AdvertisementModalItems";
import { useSession } from "next-auth/react";
import {
  IApiDisplayResponseItem,
  IApiPaginateCompanyUnits,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { useLoading } from "@/context/LoadingContext";
import { API } from "@/backend/api/api.endpoints";
import { useToast } from "@/context/ToastContext";
import { GetErrorMessage } from "@/utils/generic";
import { ContentAction, IToastType } from "@/interfaces/general";
import { AdvertisementMetricsTab } from "./Metrics/Tab";

const AdvertisementModalTab: React.FC<AdvertisementFormProps> = ({
  action,
  data,
  onUpdate,
}: AdvertisementFormProps) => {
  const { data: session } = useSession();

  const [advertisementModalLocalAlready, setAdvertisementModalLocalAlready] =
    useState<boolean>(action === ContentAction.UPDATE ? false : true);

  const openPreview = () => {
    if (!session?.api_session || !data._id) {
      return;
    }

    window.open(`/display?id=${data._id}`, "_blank");
  };

  const tabs = [
    {
      id: "ADS",
      label: "Anúncio",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <div className="text-black dark:text-white text-center">
            {data._id && (
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
            )}
            <div className="flex justify-center w-full">
              <div>
                <Display
                  list={
                    [data].map((item) => ({
                      ads: item,
                      type: AdsCurrentType.ADVERTISEMENT,
                    })) as IApiDisplayResponseItem[]
                  }
                  theme={DisplayThemes.brand}
                  style={{
                    container: "relative",
                  }}
                  preview={true}
                  useWebcam={false}
                />
              </div>
            </div>
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
