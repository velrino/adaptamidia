"use client";

import {
  AdsCurrentType,
  AdType,
  IAdsCurrentItem,
  IDisplayTheme,
} from "@/interfaces/ads";
import React, { useState, useEffect } from "react";
import { DateHelper, DateHelperFormat } from "@/utils/date";
import {
  IApiAdvertisementItem,
  IApiNewsResponseItem,
} from "@/backend/api/api.interface";

export interface IDisplayResources {
  dolar: number;
  theme: IDisplayTheme;
}

export interface IDisplayContent {
  item: IAdsCurrentItem;
  advertisement: boolean;
  resources: IDisplayResources;
}

export const DisplayContent: React.FC<IDisplayContent> = ({
  item,
  resources,
  advertisement,
}) => {
  const { theme, dolar } = resources;
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the exchange rate and time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date()); // Update the time
    }, 1000);

    return () => clearInterval(interval); // Clear the interval when the component unmounts
  }, []);

  const isAdvertisement = item.type === AdsCurrentType.ADVERTISEMENT;

  const getAdvertisement = () => {
    return item.data as IApiAdvertisementItem;
  };

  const getNews = () => {
    return item.data as IApiNewsResponseItem;
  };

  return (
    <div
      className={`relative h-full ${
        advertisement ? "w-10/12" : "w-full"
      } bg-black flex items-center justify-center overflow-hidden`}
    >
      <div
        className={`absolute top-20 text-white text-2xl bg-brand-500 px-4 py-2 z-50 rounded-r-sm left-0 ${theme.primary} ${theme.text}`}
      >
        {item.data.title}
      </div>
      {"source_name" in item.data && (
        <div
          className={`absolute top-35 text-white text-2xl bg-brand-600 px-4 py-2 z-50 rounded-r-sm left-0 ${theme.secondary} ${theme.text}`}
        >
          {item.data.source_name.toLowerCase()}
        </div>
      )}

      {isAdvertisement && getAdvertisement().type === AdType.VIDEO ? (
        <video
          src={getAdvertisement().items[0].source}
          autoPlay
          loop
          muted
          className="h-full w-full object-cover"
        ></video>
      ) : (
        <img
          src={
            isAdvertisement
              ? getAdvertisement().items[0].source
              : getNews().image
          }
          alt={item.data.title}
          className="h-full w-full object-cover"
        />
      )}
      <div
        className={`absolute bottom-30 text-white text-2xl bg-black bg-opacity-75 px-4 py-2 rounded-sm mx-10 ${theme.description} ${theme.description_text}`}
      >
        {item.data.description}
      </div>
      <footer
        className={`absolute bottom-0 left-0 right-0 h-16 flex items-center justify-between bg-brand-500 bg-opacity-75 text-white text-xl ${theme.primary} ${theme.text}`}
      >
        <div className=" px-4 py-2">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            currencyDisplay: "narrowSymbol",
          }).format(dolar)}
        </div>
        <div className=" px-4 py-2">Info Aqui</div>
        <div className=" px-4 py-2">
          {DateHelper.format(currentTime, DateHelperFormat.TIME)}
        </div>
      </footer>
    </div>
  );
};
