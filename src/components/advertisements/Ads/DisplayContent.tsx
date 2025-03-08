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
import { CiCloud } from "react-icons/ci";
// import Image from "next/image";

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
  const { dolar } = resources;
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
        className={`absolute bottom-20 text-white text-4xl py-2 z-50 left-0 w-[85vw] rounded-t-lg`}
      >
        {/* <div className="bg-neutral-900/[.5] p-5 rounded-t-lg ">
          {item.data.title.toUpperCase()}
        </div> */}
        {!isAdvertisement && (
          <>
            {item.data.title && (
              <div className="bg-neutral-900/[.5] p-5 rounded-t-lg ">
                {item.data.title.toUpperCase()}
              </div>
            )}
            {item.data.description && (
              <div className="bg-neutral-900/[.95] p-5 rounded-b-lg">
                {item.data.description}
              </div>
            )}
          </>
        )}
      </div>

      {/* {"source_name" in item.data && (
        <div
          className={`absolute bottom-15 text-white text-2xl bg-brand-600 px-4 py-2 z-50 rounded-r-sm right-0 ${theme.secondary} ${theme.text}`}
        >
          {item.data.source_name.toLowerCase()}
        </div>
      )} */}
      {/* <div
        className={`absolute bottom-40 text-white text-3xl bg-neutral-900/[.95] px-4 py-2 rounded-sm  left-0 w-[75vw]`}
      >
        {item.data.description}
      </div> */}
      <div className="absolute top-5 left-0 z-[99999] w-50">
        <div className="bg-neutral-900/[.5] p-5 rounded-t-lg">
          <img src="/images/logo/logo-dark.png" alt="Logo" />
        </div>
      </div>
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

      {/* <div className="absolute bottom-15 right-0 z-[99999] w-50">
        <div className="bg-neutral-900/[.5] p-5 rounded-t-lg">
          <img
            src="/images/logo/logo-dark.png"
            alt="Logo"
          />
        </div>
      </div> */}
      {!isAdvertisement && (
        <footer
          className={`absolute bottom-0 left-0 right-0 h-16 flex items-center justify-between bg-neutral-900/[.95] text-white text-xl`}
        >
          <div className="px-4 py-2">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              currencyDisplay: "narrowSymbol",
            }).format(dolar)}
          </div>
          <div className="px-4 py-2 flex gap-2 align-middle items-center">
            <div>
              <CiCloud size={30} />
            </div>
            <div>Hoje 31º / 19º</div>
          </div>
          <div className="px-4 py-2">
            {DateHelper.format(currentTime, DateHelperFormat.TIME)}
          </div>
        </footer>
      )}
    </div>
  );
};
