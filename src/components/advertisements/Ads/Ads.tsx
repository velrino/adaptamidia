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
import { AdDisplay } from "./AdsDisplay";
import { newsMockData } from "@/backend/mock/news";
import { DisplayNews } from "./DisplayNews";

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

enum CurrentType {
  ADVERTISEMENT = "ADVERTISEMENT",
  NEWS = "NEWS",
}

interface ICurrentItem {
  type: CurrentType;
  data: IApiAdvertisementItem | IApiNewsResponseItem;
}
//   | { type: CurrentType.ADVERTISEMENT; data: IApiAdvertisementItem }
//   | { type: CurrentType.NEWS; data: IApiNewsResponseItem };

export default function AdsComponent() {
  //   const searchParams = useSearchParams();
  //   const accessToken = searchParams.get("access_token") || null;
  //   const preview = searchParams.get("preview") || null;
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [advertisement, setAdvertisement] = useState(true);

  //   useEffect(() => {
  //     console.log({ accessToken, preview });
  //   }, [accessToken, preview]);

  const [list, setList] = useState<ICurrentItem[]>([]);
  const [currentDisplay, setCurrentDisplay] = useState<ICurrentItem>();
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
      const ads = [...AdvertisementsMockData.data, ...data].map((item) => ({
        data: item,
        type: CurrentType.ADVERTISEMENT,
      }));
      const news = [...newsMockData.data].map((item) => ({
        data: item,
        type: CurrentType.NEWS,
      }));
      setList([...news, ...ads]);
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

      let seconds = 5; //currentAd.seconds
      if (currentItem.type === CurrentType.ADVERTISEMENT) {
        currentItem.data = currentItem.data as IApiAdvertisementItem;
        seconds = currentItem?.data?.seconds || 5;
      }

      if (currentItem.type === CurrentType.NEWS) {
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
      {advertisement && <AdsSidebar />}
      {currentDisplay && (
        <>
          {currentDisplay.type === CurrentType.ADVERTISEMENT && (
            <AdDisplay
              ad={currentDisplay.data as IApiAdvertisementItem}
              advertisement={advertisement}
            />
          )}
          {currentDisplay.type === CurrentType.NEWS && (
            <DisplayNews
              item={currentDisplay.data as IApiNewsResponseItem}
              advertisement={advertisement}
            />
          )}
        </>
      )}
    </div>
  );
}
