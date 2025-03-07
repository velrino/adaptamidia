"use client";

import {
  IApiAdvertisementItem,
  IApiAdvertisementResponse,
} from "@/backend/api/api.interface";
import {
  AdvertisementsMock,
  AdvertisementsMockData,
} from "@/backend/mock/advertisements";
import React, { useState, useEffect, useCallback } from "react";
import { newsMockData } from "@/backend/mock/news";
import { ShuffleArray } from "@/utils/generic";
import {
  AdsCurrentType,
  DisplayThemes,
  IAdsCurrentItem,
  IDisplayTheme,
} from "@/interfaces/ads";
import { useSearchParams } from "next/navigation";
import { Display } from "./Display";

export default function AdsComponent() {
  const [theme, setTheme] = useState<IDisplayTheme>(DisplayThemes.green);

  const searchParams = useSearchParams();
  const accessToken = searchParams.get("access_token") || null;
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
  const [response, setResponse] = useState<IApiAdvertisementResponse>();

  const handleResponse = useCallback(async (): Promise<
    IApiAdvertisementItem[]
  > => {
    return new Promise<IApiAdvertisementItem[]>((resolve) => {
      setTimeout(() => {
        resolve(response?.data || []);
      }, 1);
    });
  }, [response]);

  useEffect(() => {
    if (!response) return;

    handleResponse().then((data) => {
      const example = [...AdvertisementsMockData.data].map((item) => ({
        data: item,
        type: AdsCurrentType.ADVERTISEMENT,
      }));
      const ads = [...data].map((item) => ({
        data: item,
        type: AdsCurrentType.ADVERTISEMENT,
      }));
      const news = [...newsMockData.data].map((item) => ({
        data: item,
        type: AdsCurrentType.NEWS,
      }));

      const combinedList = [...news, ...ads];

      const shuffledList = ShuffleArray(combinedList);

      setList(() => [...example, ...shuffledList]);
    });
  }, [response, handleResponse]);

  const getResponse = useCallback(async () => {
    const currentResponse = AdvertisementsMock({ page: 1 });
    setResponse(currentResponse);

    return new Promise<IApiAdvertisementItem[]>((resolve) => {
      setTimeout(() => {
        resolve(currentResponse.data);
      }, 1);
    });
  }, []);

  useEffect(() => {
    getResponse();
  }, [getResponse]);

  return <Display list={list} theme={theme} preview={false} />;
}
