"use client";

import {
  IApiAdvertisementResponse,
  IApiDisplayRequest,
  IApiDisplayResponse,
  IApiDisplayResponseItem,
  IApiDisplayUnitInfoRequest,
  IApiDisplayUnitInfoResponse,
  IApiPaginateAdvertisementPreview,
} from "@/backend/api/api.interface";
import React, { useState, useEffect, useCallback } from "react";
import { newsMockData } from "@/backend/mock/news";
import { GetErrorMessage, Milliseconds, ShuffleArray } from "@/utils/generic";
import { AdsCurrentType, DisplayThemes, IDisplayTheme } from "@/interfaces/ads";
import { useSearchParams } from "next/navigation";
import { Display } from "./Display";
import { FromEnum, IToastType } from "@/interfaces/general";
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
          limit: 100,
          ...apiQuery,
        };

        const response = await API.display.byUnit(currentUnit, query);

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

  const [apiUnitInfoResponse, setApiUnitInfoResponse] =
    useState<IApiDisplayUnitInfoResponse | null>(null);
  const getUnitInfo = useCallback(
    async (apiQuery: IApiDisplayUnitInfoRequest) => {
      if (!currentUnit) {
        console.log({ getDisplayByUnit: currentUnit });
        return;
      }

      try {
        const query: IApiDisplayUnitInfoRequest = apiQuery
          ? apiQuery
          : {
              from: FromEnum.CACHE,
            };

        const response = await API.display.unitInfo(currentUnit, query);

        const data = await response.json();

        if (data?.error) {
          showToast(GetErrorMessage(data.error), IToastType.ERROR);
        } else if (response.ok) {
          setApiUnitInfoResponse(data);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
      }
    },
    [showToast, setApiUnitInfoResponse, currentUnit]
  );

  useEffect(() => {
    if (adsIdForPreview) {
      // INICIO DO PREVIEW
      getPreview({
        id: adsIdForPreview,
      });
      // FINAL DO PREVIEW
    } else if (currentUnit) {
      // INICIO DO DISPLAY REAL - UNIDADE
      getUnitInfo({ from: FromEnum.CACHE });
      getDisplayByUnit({ page: 1 });

      const interval = setInterval(() => {
        getUnitInfo({ from: FromEnum.CACHE });
      }, Milliseconds({ minutes: 5 }));

      return () => clearInterval(interval);
      // FINAL DO DISPLAY REAL - UNIDADE
    }
  }, [getPreview, getUnitInfo, adsIdForPreview, currentUnit, getDisplayByUnit]);

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
  }, [responseAdvertisement, adsIdForPreview]);

  useEffect(() => {
    if (apiDisplayResponse) {
      setList(() => apiDisplayResponse.data);
    }
  }, [apiDisplayResponse]);

  return (
    <>
      {list.length > 0 && (
        <Display
          list={list}
          theme={theme}
          preview={false}
          unit={currentUnit}
          currency={apiUnitInfoResponse?.currency}
          weather={apiUnitInfoResponse?.weather}
        />
      )}
    </>
  );
}
