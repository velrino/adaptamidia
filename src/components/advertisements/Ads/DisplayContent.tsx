"use client";

/* eslint-disable @next/next/no-img-element */
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

  return (
    <div
      className={`
        relative h-full 
        ${advertisement ? "w-10/12" : "w-full"} 
        bg-black flex items-center justify-center overflow-hidden
      `}
    >
      {/* Logo no topo */}
      {!isAdvertisement && (
        <div className="absolute top-5 left-0 z-[99999]">
          <div className="bg-neutral-900/50 p-5 rounded-r-lg">
            <Image
              src="/images/logo/logo-dark.png"
              alt="Logo"
              width={120}
              height={40}
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Título e descrição (se não for anúncio) */}
      {!isAdvertisement && (
        <div className="absolute bottom-20 text-white text-4xl py-2 z-50 left-0 w-[85vw]">
          {item.data.title && (
            <div className="bg-neutral-900/50 p-5 rounded-t-lg">
              {item.data.title.toUpperCase()}
            </div>
          )}
          {item.data.description && (
            <div className="bg-neutral-900/95 p-5 rounded-b-lg">
              {item.data.description}
            </div>
          )}
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
            {DateHelper.format(currentTime, DateHelperFormat.TIME)}
          </div>
        </footer>
      )}
    </div>
  );
};
