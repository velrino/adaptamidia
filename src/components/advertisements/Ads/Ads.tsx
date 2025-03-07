"use client";

import {
  IApiAdvertisementItem,
  IApiAdvertisementResponse,
  IApiNewsResponseItem,
} from "@/backend/api/api.interface";
import {
  AdvertisementsMock,
  AdvertisementsMockData,
} from "@/backend/mock/advertisements";
import React, { useState, useEffect, useCallback } from "react";
import { AdsSidebar } from "./AdsSidebar";
import { newsMockData } from "@/backend/mock/news";
import { ShuffleArray } from "@/utils/generic";
import { DisplayContent } from "./DisplayContent";
import {
  AdsCurrentType,
  DisplayThemes,
  IAdsCurrentItem,
  IDisplayTheme,
} from "@/interfaces/ads";
import { useSearchParams } from "next/navigation";

interface AdStat {
  index: number;
  count: number;
  timestamps: string[];
}

const sendAPI = () => {
  const storedData = JSON.parse(localStorage.getItem("adStats") || "[]");
  console.log("Sending data to API:", storedData);
};

const updateAdStats = (adIndex: number) => {
  const stats: AdStat[] = JSON.parse(
    localStorage.getItem("adStats") || "[]"
  ) as AdStat[];
  const adStatIndex = (stats || []).findIndex(
    (stat: AdStat) => stat.index === adIndex
  );

  if (adStatIndex > -1) {
    stats[adStatIndex].count += 1;
    stats[adStatIndex].timestamps.push(new Date().toISOString());
  } else {
    stats.push({
      index: adIndex,
      count: 1,
      timestamps: [new Date().toISOString()],
    });
  }
  localStorage.setItem("adStats", JSON.stringify(stats));
};

export default function AdsComponent() {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [advertisement, setAdvertisement] = useState(true);
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
  const [currentDisplay, setCurrentDisplay] = useState<IAdsCurrentItem>();
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

  useEffect(() => {
    if (list.length) {
      const currentItem = list[currentAdIndex];
      setCurrentDisplay(() => currentItem);

      let seconds = 3; //currentAd.seconds
      if (currentItem.type === AdsCurrentType.ADVERTISEMENT) {
        currentItem.data = currentItem.data as IApiAdvertisementItem;
        seconds = 3; //currentItem?.data?.seconds || 5;
      }

      if (currentItem.type === AdsCurrentType.NEWS) {
        currentItem.data = currentItem.data as IApiNewsResponseItem;
      }

      updateAdStats(currentAdIndex);

      console.log({ type: currentItem.type, currentAd: seconds });

      const timer = setTimeout(() => {
        const nextIndex = (currentAdIndex + 1) % list.length;
        // setAdvertisement(() => list[nextIndex].spotlight);
        setAdvertisement(() => true);
        sendAPI();
        setCurrentAdIndex(nextIndex);
      }, seconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [list, currentAdIndex]);

  return (
    <div className="h-screen w-screen flex">
      {advertisement && <AdsSidebar theme={theme} />}
      {currentDisplay && (
        <DisplayContent
          item={currentDisplay}
          advertisement={advertisement}
          theme={theme}
        />
      )}
    </div>
  );
}
