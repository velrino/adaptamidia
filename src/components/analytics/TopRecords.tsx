"use client";
import React, { useCallback, useEffect, useState } from "react";
import TopRecordsItem from "./TopRecords/TopRecordsItem";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import {
  IApiDashboardDisplayByAdvertisementRequest,
  IApiDashboardDisplayByAdvertisementResponse,
} from "@/backend/api/api.interface";
import { GetErrorMessage } from "@/utils/generic";
import { FromEnum, IToastType } from "@/interfaces/general";
import { API } from "@/backend/api/api.endpoints";
import { DateHelper } from "@/utils/date";
import { IApiDashboardGeneralType } from "@/interfaces/dashboard";

export default function TopRecords() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [responseDisplayByAdvertisement, setResponseDisplayByAdvertisement] =
    useState<IApiDashboardDisplayByAdvertisementResponse>();

  // useEffect(() => {}, [responseDisplayByAdvertisement]);

  const [apiQueryForm] = useState({
    start_at: DateHelper.subtractDays(new Date(), 1, "year").toDate(),
    end_at: DateHelper.addDays(new Date(), 1, "year").toDate(),
  });

  const getResponseDisplayByAdvertisement = useCallback(
    async (apiQuery: Partial<IApiDashboardDisplayByAdvertisementRequest>) => {
      if (!session?.api_session) {
        return;
      }

      try {
        const query: IApiDashboardDisplayByAdvertisementRequest = {
          from: FromEnum.CACHE,
          chart_type: IApiDashboardGeneralType.DISPLAY_BY_ADVERTISEMENT,
          page: 1,
          limit: 10,
          sort: {
            column: "total",
            value: -1,
          },
          ...apiQueryForm,
          ...apiQuery,
        };

        const response = await API.dashboard.generalResume(
          session.api_session.access_token,
          query
        );

        const responseData = await response.json();

        if (responseData?.error) {
          showToast(GetErrorMessage(responseData.message), IToastType.ERROR);
        } else if (response.ok) {
          setResponseDisplayByAdvertisement(responseData);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      }
    },
    [session?.api_session, showToast, apiQueryForm]
  );

  useEffect(() => {
    if (session?.api_session) {
      getResponseDisplayByAdvertisement({});
    }
  }, [getResponseDisplayByAdvertisement, session?.api_session]);

  return (
    <>
      <TopRecordsItem
        title="Anúncios mais exibidos"
        list={{
          title: "Anúncio",
          valueHeader: "Exibições",
          items: (responseDisplayByAdvertisement?.records || []).map((item) => {
            return {
              id: item.advertisement_id,
              label: `${item.advertisement_title}`,
              value: String(item.total),
            };
          }),
        }}
      />
      <TopRecordsItem
        title="Lorem"
        list={{
          title: "Shazam",
          valueHeader: "Exibições",
          items: [
            { label: "La Ville", value: "4.7K" },
            { label: "Restaurante Paulista", value: "3.4K" },
            { label: "Restaurante Itaim Bibi", value: "2.9K" },
            { label: "Restaurante Moema", value: "1.5K" },
          ],
        }}
      />
      <TopRecordsItem
        title="Lorem"
        list={{
          title: "Shazam",
          valueHeader: "Exibições",
          items: [
            { label: "La Ville", value: "4.7K" },
            { label: "Restaurante Paulista", value: "3.4K" },
            { label: "Restaurante Itaim Bibi", value: "2.9K" },
            { label: "Restaurante Moema", value: "1.5K" },
          ],
        }}
      />
    </>
  );
}
