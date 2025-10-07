"use client";
import React, { useCallback, useEffect, useState } from "react";
import TopRecordsItem from "./TopRecords/TopRecordsItem";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import {
  IApiDashboardAdvertisementByCompanyRequest,
  IApiDashboardAdvertisementByCompanyResponse,
  IApiDashboardDisplayByAdvertisementRequest,
  IApiDashboardDisplayByAdvertisementResponse,
  IApiDashboardDisplayByUnitRequest,
  IApiDashboardDisplayByUnitResponse,
} from "@/backend/api/api.interface";
import { GetErrorMessage } from "@/utils/generic";
import { FromEnum, IToastType } from "@/interfaces/general";
import { API } from "@/backend/api/api.endpoints";
import { DateHelper, DateHelperFormat } from "@/utils/date";
import { IApiDashboardGeneralType } from "@/interfaces/dashboard";

export default function TopRecords() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  // useEffect(() => {}, [responseDisplayByAdvertisement]);

  const [apiQueryForm] = useState({
    start_at: DateHelper.subtractDays(new Date(), 30, "days").toDate(),
    end_at: DateHelper.endOf(new Date(), "month").toDate(),
  });

  const [responseDisplayByAdvertisement, setResponseDisplayByAdvertisement] =
    useState<IApiDashboardDisplayByAdvertisementResponse>();
  const [loadingDisplayByAdvertisement, setLoadingDisplayByAdvertisement] =
    useState<boolean>(false);
  const getResponseDisplayByAdvertisement = useCallback(
    async (apiQuery: Partial<IApiDashboardDisplayByAdvertisementRequest>) => {
      if (!session?.api_session) {
        return;
      }

      try {
        setLoadingDisplayByAdvertisement(true);
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
      } finally {
        setLoadingDisplayByAdvertisement(false);
      }
    },
    [session?.api_session, showToast, apiQueryForm]
  );

  const [responseDisplayByUnit, setResponseDisplayByUnit] =
    useState<IApiDashboardDisplayByUnitResponse>();
  const [loadingDisplayByUnit, setLoadingDisplayByUnit] =
    useState<boolean>(false);
  const getResponseDisplayByUnit = useCallback(
    async (apiQuery: Partial<IApiDashboardDisplayByUnitRequest>) => {
      if (!session?.api_session) {
        return;
      }

      try {
        setLoadingDisplayByUnit(true);
        const query: IApiDashboardDisplayByUnitRequest = {
          from: FromEnum.CACHE,
          chart_type: IApiDashboardGeneralType.DISPLAY_BY_UNIT,
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
          setResponseDisplayByUnit(responseData);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
        setLoadingDisplayByUnit(false);
      }
    },
    [session?.api_session, showToast, apiQueryForm]
  );

  const [responseAdvertisementByCompany, setResponseAdvertisementByCompany] =
    useState<IApiDashboardAdvertisementByCompanyResponse>();
  const [loadingAdvertisementByCompany, setLoadingAdvertisementByCompany] =
    useState<boolean>(false);
  const getResponseAdvertisementByCompany = useCallback(
    async (apiQuery: Partial<IApiDashboardAdvertisementByCompanyRequest>) => {
      if (!session?.api_session) {
        return;
      }

      try {
        setLoadingAdvertisementByCompany(true);
        const query: IApiDashboardDisplayByUnitRequest = {
          from: FromEnum.CACHE,
          chart_type: IApiDashboardGeneralType.ADVERTISEMENT_BY_COMPANY,
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
          setResponseAdvertisementByCompany(responseData);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
        setLoadingAdvertisementByCompany(false);
      }
    },
    [session?.api_session, showToast, apiQueryForm]
  );

  useEffect(() => {
    if (session?.api_session) {
      getResponseDisplayByAdvertisement({});
      getResponseDisplayByUnit({});
      getResponseAdvertisementByCompany({});
    }
  }, [
    getResponseDisplayByAdvertisement,
    getResponseDisplayByUnit,
    getResponseAdvertisementByCompany,
    session?.api_session,
  ]);

  const [subtitle, setSubtitle] = useState<string>(String());

  useEffect(() => {
    setSubtitle(
      () =>
        `${DateHelper.format(
          apiQueryForm.start_at,
          DateHelperFormat.SHORT
        )} - ${DateHelper.format(apiQueryForm.end_at, DateHelperFormat.SHORT)}`
    );
  }, [apiQueryForm]);

  return (
    <>
      <TopRecordsItem
        title="Anúncios mais exibidos"
        subtitle={subtitle}
        loading={loadingDisplayByAdvertisement}
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
        title="Melhores Estabelecimentos"
        subtitle={subtitle}
        loading={loadingDisplayByUnit}
        list={{
          title: "Estabelecimento",
          valueHeader: "Exibições",
          items: (responseDisplayByUnit?.records || []).map((item) => {
            return {
              id: item.local_unit_id,
              label: `${item.local_unit_name}`,
              value: String(item.total),
            };
          }),
        }}
      />
      <TopRecordsItem
        title="Maiores anunciantes"
        subtitle={subtitle}
        loading={loadingAdvertisementByCompany}
        list={{
          title: "Anunciante",
          valueHeader: "Anúncios",
          items: (responseAdvertisementByCompany?.records || []).map((item) => {
            return {
              id: item.company_id,
              label: `${item.company_name}`,
              value: String(item.total),
            };
          }),
        }}
      />
    </>
  );
}
