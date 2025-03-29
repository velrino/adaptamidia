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
import Image from "next/image";
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

  const parser = new DOMParser();
  const doc = parser.parseFromString(item.data.description, "text/html");
  const cleanDescription = doc.body.textContent || "";

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
                    <div className="bg-neutral-900/95 text-white rounded-tr-full max-w-[40vw]">
                      <div className="uppercase text-gray-300 text-2xl pt-2">
                        {getNews().keyword}
                      </div>
                    </div>
                    <div className="bg-neutral-900/95 text-white rounded-r-full max-w-[80vw]">
                      <div className="grid grid-cols-12">
                        <div className="col-span-10">
                          <div className="uppercase text-gray-300 text-3xl my-3">
                            {item.data.title.toUpperCase()}
                          </div>
                          <div className="text-gray-300 text-md overflow-hidden text-ellipsis my-3 font-light">
                            {cleanDescription}
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <div className="bg-white">
                            <Image
                              src="/images/ads/qrcode.png"
                              height={100}
                              width={100}
                              alt="Logo"
                            />
                          </div>
                        </div>
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
      {isAdvertisement && getAdvertisement().type === AdType.VIDEO ? (
        <video
          src={
            isAdvertisement
              ? getAdvertisement().items[0].source
              : getNews().image
          }
          autoPlay
          loop
          muted
          className="h-full w-full object-cover"
        />
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

      {/* Rodapé (se não for anúncio) */}
      {!isAdvertisement && (
        <footer className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-between bg-neutral-900/95 text-white text-xl">
          <div className="px-4 py-2">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              currencyDisplay: "narrowSymbol",
            }).format(dolar)}
          </div>
          <div className="px-4 py-2 flex gap-2 items-center">
            <CiCloud size={30} />
            <span>Hoje 31º / 19º</span>
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
