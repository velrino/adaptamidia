"use client";

import { AdsCurrentType, AdType, IDisplayTheme } from "@/interfaces/ads";
import React, { useState, useEffect, useCallback } from "react";
import { DateHelper, DateHelperFormat } from "@/utils/date";
import {
  IApiAdvertisementItem,
  IApiCurrencyResponse,
  IApiDisplayResponseItem,
  IApiNewsResponseItem,
  IApiWeatherResponse,
} from "@/backend/api/api.interface";
// import { CiCloud } from "react-icons/ci";
import Image from "next/image";
import { faker } from "@faker-js/faker";

export interface IDisplayResources {
  // dolar: number;
  currency?: IApiCurrencyResponse;
  weather?: IApiWeatherResponse;
  theme: IDisplayTheme;
}

export interface IDisplayContent {
  item: IApiDisplayResponseItem;
  advertisement: boolean;
  resources: IDisplayResources;
}

export const DisplayContent: React.FC<IDisplayContent> = ({
  item,
  resources,
  advertisement,
}) => {
  const { currency, weather } = resources;
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the exchange rate and time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date()); // Update the time
    }, 1000);

    return () => clearInterval(interval); // Clear the interval when the component unmounts
  }, []);

  const isAdvertisement =
    item.ads && item.type === AdsCurrentType.ADVERTISEMENT;

  const getAdvertisement = useCallback(() => {
    return item.ads as IApiAdvertisementItem;
  }, [item]);

  const getNews = useCallback(() => {
    return item.news as IApiNewsResponseItem;
  }, [item]);

  const parser = new DOMParser();
  const doc =
    item.news && parser.parseFromString(item.news.description, "text/html");
  const cleanDescription = (doc && doc.body.textContent) || "";
  const [assetURL, setAssetURL] = useState<string | null>(String());

  useEffect(() => {
    if (item?.news && item?.news?.image) {
      setAssetURL(() => getNews().image);
    } else if (item?.ads && item?.ads?.items?.[0]?.source) {
      setAssetURL(() => getAdvertisement().items[0].source);
    }
  }, [item, getAdvertisement, getNews]);

  return (
    <div
      className={`
        relative h-full 
        ${advertisement ? "w-10/12" : "w-full"} 
        bg-black flex items-center justify-center overflow-hidden
      `}
    >
      {!isAdvertisement && (
        <div className="absolute bottom-20 left-10 w-[90vw]">
          <div className=" text-white font-bold py-4 px-6 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <div className="grid grid-cols-12">
                  <div className="col-span-2 bg-neutral-900/95 rounded-l-full flex items-center justify-center">
                    <Image
                      width={100}
                      height={20}
                      src="/images/logo/icon-light.png"
                      alt="Logo"
                    />
                  </div>
                  <div className="col-span-10">
                    <div className="bg-neutral-900/95 text-white rounded-tr-full max-w-[15vw]">
                      <div className="uppercase text-gray-300 text-2xl pt-2">
                        {item.news && getNews().keyword}
                      </div>
                    </div>
                    <div className="bg-neutral-900/95 text-white rounded-r-full max-w-[80vw]">
                      <div className="grid grid-cols-12">
                        <div className="col-span-10">
                          <div className="uppercase text-white text-3xl my-3">
                            {item.news && getNews().title.toUpperCase()}
                          </div>
                          <div className="text-gray-300 text-md overflow-hidden text-ellipsis my-3 font-light">
                            {cleanDescription}
                          </div>
                        </div>
                        {/* <div className="col-span-2 flex items-center justify-center">
                          <div className="bg-white">
                            <Image
                              src="/images/ads/qrcode.png"
                              height={100}
                              width={100}
                              alt="Logo"
                            />
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mídia (vídeo ou imagem) */}
      {assetURL && item.ads && item.ads.type === AdType.VIDEO ? (
        <video
          src={`/api/proxy?url=${encodeURIComponent(assetURL)}`}
          autoPlay
          loop
          muted
          className="h-full w-full object-cover"
        />
      ) : (
        assetURL && (
          <img
            src={`/api/proxy?url=${encodeURIComponent(assetURL)}`}
            alt={""}
            className="h-full w-full object-cover"
          />
        )
      )}

      {/* Rodapé (se não for anúncio) */}
      {!isAdvertisement && (
        <footer className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-between bg-neutral-900/95 text-white text-xl">
          <div className="px-4 py-2">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              currencyDisplay: "narrowSymbol",
            }).format(
              currency?.bid ||
                faker.number.float({ min: 5.7, max: 5.9, fractionDigits: 2 })
            )}
          </div>
          <div className="px-4 py-2 flex gap-2 items-center">
            {/* <CiCloud size={30} /> */}
            {weather && (
              <>
                <Image
                  width={30}
                  height={30}
                  src={`https:${weather?.icon}`}
                  alt="Weather icon"
                />
                <span>Hoje {Math.floor(weather?.temperature_c || 31)}º</span>
              </>
            )}
          </div>
          <div className="px-4 py-2">
            {`${DateHelper.format(
              currentTime,
              DateHelperFormat.SHORT2
            )} - ${DateHelper.format(currentTime, DateHelperFormat.TIME)}`}
          </div>
        </footer>
      )}
    </div>
  );
};
