"use client";

import {
  IApiAdvertisementResponse,
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
import {
  AdsCurrentType,
  DisplayThemes,
  IAdsCurrentItem,
  IDisplayTheme,
} from "@/interfaces/ads";
import { useSearchParams } from "next/navigation";
import { Display } from "./Display";
import { IToastType } from "@/interfaces/general";
import { useToast } from "@/context/ToastContext";
import { API } from "@/backend/api/api.endpoints";

export default function AdsComponent() {
  const [theme, setTheme] = useState<IDisplayTheme>(DisplayThemes.green);
  const { showToast } = useToast();

  const searchParams = useSearchParams();
  const accessToken = searchParams.get("access_token") || null;
  const adsIdForPreview = searchParams.get("id") || null;
  const preview = searchParams.get("preview") || null;
  const themeInformed = searchParams.get("theme") || "green";

  useEffect(() => {
    if (DisplayThemes[themeInformed]) {
      setTheme(DisplayThemes[themeInformed]);
    } else {
      setTheme(DisplayThemes.green);
    }
  }, [accessToken, preview, themeInformed]);

  const [list, setList] = useState<IAdsCurrentItem[]>([]);

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

  useEffect(() => {
    if (adsIdForPreview) {
      getPreview({
        id: adsIdForPreview,
      });
    } else {
      getResponse({});
    }
  }, [getResponse, getPreview, adsIdForPreview]);

  useEffect(() => {
    if (!responseAdvertisement) return;

    if (adsIdForPreview) {
      const adsForPreview = [...responseAdvertisement.data].map((item) => ({
        data: item,
        type: AdsCurrentType.ADVERTISEMENT,
      }));

      const randomNews = ShuffleArray(newsMockData.data);
      const news = [randomNews[0], randomNews[1]].map((item) => ({
        data: item,
        type: AdsCurrentType.NEWS,
      }));

      setList([...adsForPreview, ...news]);
      // setList(news);
    }
  }, [responseAdvertisement]);

  return (
    <>{list.length && <Display list={list} theme={theme} preview={false} />}</>
  );
}
