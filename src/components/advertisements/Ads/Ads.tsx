"use client";

import {
  IApiAdvertisementItem,
  IApiAdvertisementResponse,
} from "@/backend/api/api.interface";
import {
  AdvertisementsMock,
  AdvertisementsMockData,
} from "@/backend/mock/advertisements";
import { AdType } from "@/interfaces/ads";
// import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { AdsSidebar } from "./AdsSidebar";
import { DateHelper, DateHelperFormat } from "@/utils/date";
import { faker } from "@faker-js/faker";

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

const AdDisplay: React.FC<{
  ad: IApiAdvertisementItem;
  advertisement: boolean;
}> = ({ ad, advertisement }) => {
  const dolar = faker.number.float({ min: 5, max: 6, fractionDigits: 2 });

  return (
    <div
      className={`relative h-full ${
        advertisement ? "w-9/12" : "w-full"
      } bg-black flex items-center justify-center overflow-hidden`}
    >
      <div className="absolute top-20 text-white text-2xl bg-brand-500 px-4 py-2 z-50 rounded-r-sm left-0">
        {ad.title}
      </div>
      {ad.type === AdType.VIDEO ? (
        <video
          src={ad.items[0].source}
          autoPlay
          loop
          muted
          className="h-full w-full object-cover"
        ></video>
      ) : (
        <img
          src={ad.items[0].source}
          alt={ad.title}
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute bottom-52 text-white text-2xl bg-black bg-opacity-75 px-4 py-2 rounded-sm mx-10">
        {ad.description}
      </div>
      <footer className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-between bg-brand-500 bg-opacity-75 text-white text-xl">
        <div className=" px-4 py-2">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            currencyDisplay: "narrowSymbol",
          }).format(dolar)}
        </div>
        <div className=" px-4 py-2">Info Aqui</div>
        <div className=" px-4 py-2">
          {DateHelper.format(new Date(), DateHelperFormat.TIME)}
        </div>
      </footer>
    </div>
  );
};

export default function AdsComponent() {
  //   const searchParams = useSearchParams();
  //   const accessToken = searchParams.get("access_token") || null;
  //   const preview = searchParams.get("preview") || null;
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [advertisement, setAdvertisement] = useState(true);

  //   useEffect(() => {
  //     console.log({ accessToken, preview });
  //   }, [accessToken, preview]);

  const [list, setList] = useState<IApiAdvertisementItem[]>([]);
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
      setList([...AdvertisementsMockData.data, ...data]);
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
      const currentAd = list[currentAdIndex];
      const seconds = 5; //currentAd.seconds
      updateAdStats(currentAdIndex);
      console.log({ currentAd: currentAd.seconds });

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
      {advertisement && (
        // <div className="relative h-full w-3/12 z-50 bg-red-600 flex items-center justify-center text-white text-3xl">
        //   Anuncio Aqui
        // </div>
        <AdsSidebar />
      )}
      {list.length >= 1 && (
        <AdDisplay ad={list[currentAdIndex]} advertisement={advertisement} />
      )}
    </div>
  );
}
