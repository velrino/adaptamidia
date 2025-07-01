import { Tabs } from "@/components/ui/tabs/Principal";
import React, { useCallback, useEffect, useState } from "react";
import AdvertisementModalLocal from "./AdvertisementModalLocal";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { IAdvertisementModalCommonProps } from "./interface";
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

const AdvertisementModalTab: React.FC<IAdvertisementModalCommonProps> = ({
  action,
  data,
  onUpdate,
}: IAdvertisementModalCommonProps) => {
  const { data: session } = useSession();
  const { showFullScreenLoading, hideFullScreenLoading } = useLoading();
  const { showToast } = useToast();

  const [advertisementModalLocalAlready, setAdvertisementModalLocalAlready] =
    useState<boolean>(action === ContentAction.UPDATE ? false : true);
  const [defaultUnits, setDefaultUnits] = useState<IApiUnitItemResponse[]>([]);

  const getDefaultUnits = useCallback(
    async (apiQuery: IApiPaginateCompanyUnits) => {
      if (!session?.api_session) {
        return;
      }
      showFullScreenLoading();
      try {
        const query: IApiPaginateCompanyUnits = {
          limit: 100,
          ...apiQuery,
        };

        const response = await API.company_units.paginatePost(
          session.api_session.access_token,
          query
        );

        const responseData = await response.json();

        if (responseData?.error) {
          showToast(GetErrorMessage(responseData.error), IToastType.ERROR);
        } else if (response.ok) {
          setDefaultUnits((prevUnits) => {
            const existingIds = new Set(
              prevUnits.map((unit: IApiUnitItemResponse) => unit._id)
            );
            const newUnits = responseData.data.filter(
              (unit: IApiUnitItemResponse) => !existingIds.has(unit._id)
            );
            return [...prevUnits, ...newUnits]; // Adiciona apenas os novos
          });
          showToast("Carregado com sucesso", IToastType.SUCCESS);
          setAdvertisementModalLocalAlready(() => true);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
        hideFullScreenLoading();
      }
    },
    [
      session?.api_session,
      showToast,
      showFullScreenLoading,
      hideFullScreenLoading,
    ]
  );

  useEffect(() => {
    if (action === ContentAction.UPDATE && data.units.length) {
      setAdvertisementModalLocalAlready(() => false);
      getDefaultUnits({ units: data.units });
    }
  }, []);

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
        <div className="grid grid-cols-2 gap-4 p-4">
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
            <div className="flex justify-center max-h-0">
              <div className="scale-45">
                <Display
                  list={
                    [data].map((item) => ({
                      ads: item,
                      type: AdsCurrentType.ADVERTISEMENT,
                    })) as IApiDisplayResponseItem[]
                  }
                  theme={DisplayThemes.brand}
                  preview={true}
                />
              </div>
            </div>
          </div>
          <div className="aspect-video">
            <AdvertisementComponent data={data} onUpdate={onUpdate} />
          </div>
        </div>
      ),
    },
    {
      id: "ABOUT",
      label: "Sobre",
      content: (
        <AdvertisementModalAbout
          action={action}
          data={data}
          onUpdate={onUpdate}
        />
      ),
    },
    {
      id: "LOCAL",
      label: `Estabelecimentos`,
      content: (
        <>
          {advertisementModalLocalAlready === true && (
            <AdvertisementModalLocal
              action={action}
              data={data}
              onUpdate={onUpdate}
              default_units={defaultUnits}
            />
          )}
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

    // {
    //   id: "Three",
    //   label: "Three",
    //   content: <TabTwo data={data} onUpdate={onUpdate} />,
    // },
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

// const TabTwo: React.FC<{
//   data: IApiAdvertisementItem;
//   onUpdate: (data: Partial<IApiAdvertisementItem>) => void;
// }> = ({ data, onUpdate }) => {
//   return (
//     <div className="space-y-2">
//       <p>title: {data.title}</p>
//       <p>end_date: {data.end_date}</p>
//       <Input
//         type="text"
//         value={data.title}
//         onChange={(e) => onUpdate({ title: e.target.value })}
//         placeholder="Edit Name"
//       />
//     </div>
//   );
// };

export default AdvertisementModalTab;
