"use client";

import { AdsCurrentType, AdType, IAdsCurrentItem } from "@/interfaces/ads";
import React, { useState, useEffect } from "react";
import { DateHelper, DateHelperFormat } from "@/utils/date";
import { faker } from "@faker-js/faker";
import {
  IApiAdvertisementItem,
  IApiNewsResponseItem,
} from "@/backend/api/api.interface";

export const DisplayContent: React.FC<{
  item: IAdsCurrentItem;
  advertisement: boolean;
}> = ({ item, advertisement }) => {
  const dolar = faker.number.float({ min: 5, max: 6, fractionDigits: 2 });
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
      <div className="absolute top-20 text-white text-2xl bg-brand-500 px-4 py-2 z-50 rounded-r-sm left-0">
        {item.data.title}
      </div>
      {"source_name" in item.data && (
        <div className="absolute top-35 text-white text-2xl bg-brand-600 px-4 py-2 z-50 rounded-r-sm left-0">
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
      <div className="absolute bottom-30 text-white text-2xl bg-black bg-opacity-75 px-4 py-2 rounded-sm mx-10">
        {item.data.description}
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
          {DateHelper.format(currentTime, DateHelperFormat.TIME)}
        </div>
      </footer>
    </div>
  );
};
