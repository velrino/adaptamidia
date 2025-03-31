"use client";

import {
  IApiAdvertisementResponse,
  IApiDisplayRequest,
  IApiDisplayResponse,
  IApiDisplayResponseItem,
  IApiPaginateAdvertisement,
  IApiPaginateAdvertisementPreview,
} from "@/backend/api/api.interface";
// import {
//   AdvertisementsMock,
//   AdvertisementsMockData,
// } from "@/backend/mock/advertisements";
import React, { useState, useEffect, useCallback } from "react";
import { newsMockData } from "@/backend/mock/news";
import { GetErrorMessage, ShuffleArray } from "@/utils/generic";
import { AdsCurrentType, DisplayThemes, IDisplayTheme } from "@/interfaces/ads";
import { useSearchParams } from "next/navigation";
import { Display } from "./Display";
import { IToastType } from "@/interfaces/general";
import { useToast } from "@/context/ToastContext";
import { API } from "@/backend/api/api.endpoints";
import { useLoading } from "@/context/LoadingContext";

export default function AdsComponent() {
  const [theme, setTheme] = useState<IDisplayTheme>(DisplayThemes.green);
  const { showToast } = useToast();
  const { showFullScreenLoading, hideFullScreenLoading } = useLoading();

  const searchParams = useSearchParams();
  const accessToken = searchParams.get("access_token") || null;
  const adsIdForPreview = searchParams.get("id") || null;
  const preview = searchParams.get("preview") || null;
  const currentUnit = searchParams.get("unit") || null;
  const themeInformed = searchParams.get("theme") || "green";

  useEffect(() => {
    if (DisplayThemes[themeInformed]) {
      setTheme(DisplayThemes[themeInformed]);
    } else {
      setTheme(DisplayThemes.green);
    }
  }, [accessToken, preview, themeInformed]);

  const [list, setList] = useState<IApiDisplayResponseItem[]>([]);
  const [apiDisplayResponse, setApiDisplayResponse] =
    useState<IApiDisplayResponse | null>(null);

  const [responseAdvertisement, setResponseAdvertisement] =
    useState<IApiAdvertisementResponse>();

  const getResponse = useCallback(
    async (apiQuery: IApiPaginateAdvertisement) => {
      if (!accessToken) {
        showToast("Informe o Access Token", IToastType.ERROR);
        return;
      }

      try {
        const query: IApiPaginateAdvertisement = {
          page: 1,
          limit: 100,
          ...apiQuery,
        };

        const response = await API.advertisement.paginate(accessToken, query);

        const data = await response.json();

        if (data?.error) {
          showToast(GetErrorMessage(data.error), IToastType.ERROR);
        } else if (response.ok) {
          setResponseAdvertisement(data);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      }
    },
    [accessToken, showToast, setResponseAdvertisement]
  );

  const getPreview = useCallback(
    async (apiQuery: IApiPaginateAdvertisementPreview) => {
      try {
        const query: IApiPaginateAdvertisementPreview = {
          page: 1,
          limit: 1,
          ...apiQuery,
        };

        const response = await API.advertisement.preview(query);

        const data = await response.json();

        if (data?.error) {
          showToast(GetErrorMessage(data.error), IToastType.ERROR);
        } else if (response.ok) {
          setResponseAdvertisement(data);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      }
    },
    [showToast, setResponseAdvertisement]
  );

  const getDisplayByUnit = useCallback(
    async (apiQuery: IApiDisplayRequest) => {
      if (!currentUnit) {
        console.log({ getDisplayByUnit: currentUnit });
        return;
      }

      showFullScreenLoading();

      try {
        const query: IApiDisplayRequest = {
          page: 1,
          limit: 1,
          ...apiQuery,
        };

        const response = await API.advertisement.display(currentUnit, query);

        const data = await response.json();

        if (data?.error) {
          showToast(GetErrorMessage(data.error), IToastType.ERROR);
        } else if (response.ok) {
          setApiDisplayResponse(data);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
        hideFullScreenLoading();
      }
    },
    [showToast, setApiDisplayResponse, currentUnit]
  );

  useEffect(() => {
    if (adsIdForPreview) {
      getPreview({
        id: adsIdForPreview,
      });
    } else if (currentUnit) {
      getDisplayByUnit({ page: 1 });
    } else {
      getResponse({});
    }
  }, [getResponse, getPreview, adsIdForPreview, currentUnit, getDisplayByUnit]);

  useEffect(() => {
    if (!responseAdvertisement) return;

    if (adsIdForPreview) {
      const adsForPreview = [...responseAdvertisement.data].map((item) => ({
        ads: item,
        type: AdsCurrentType.ADVERTISEMENT,
      }));

      const randomNews = ShuffleArray(newsMockData.data);
      const news = [randomNews[0], randomNews[1]].map((item) => ({
        news: item,
        type: AdsCurrentType.NEWS,
      }));

      setList([...adsForPreview, ...news] as IApiDisplayResponseItem[]);
      // setList(news);
    }
  }, [responseAdvertisement]);

  useEffect(() => {
    if (apiDisplayResponse) {
      setList(() => apiDisplayResponse.data);
      // console.log({ apiDisplayResponse });
    }
  }, [apiDisplayResponse]);

  return (
    <>
      {list.length > 0 && <Display list={list} theme={theme} preview={false} />}
    </>
  );
}
