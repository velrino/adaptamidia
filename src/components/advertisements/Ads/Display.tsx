"use client";

import { IApiDisplayResponseItem } from "@/backend/api/api.interface";

import React, { useState, useEffect } from "react";
import { AdsSidebar } from "./AdsSidebar";
import { DisplayContent } from "./DisplayContent";
import { AdsCurrentType, IDisplayTheme } from "@/interfaces/ads";
import { faker } from "@faker-js/faker";

interface AdStat {
  index: number;
  count: number;
  timestamps: string[];
}

const sendAPI = () => {
  // const storedData = JSON.parse(localStorage.getItem("adStats") || "[]");
  // console.log("Sending data to API:", storedData);
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

export interface IDisplay {
  list: IApiDisplayResponseItem[];
  theme: IDisplayTheme;
  preview: boolean;
  style?: {
    container?: string;
  };
}

export function Display({ list, theme, preview, style }: IDisplay) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [advertisement, setAdvertisement] = useState(false);
  const [dolar, setDolar] = useState<number>(0);

  const [currentDisplay, setCurrentDisplay] =
    useState<IApiDisplayResponseItem>();

  useEffect(() => {
    setDolar(() =>
      faker.number.float({
        min: 5.7,
        max: 5.9,
        fractionDigits: 2,
      })
    );
  }, []);

  useEffect(() => {
    if (list.length) {
      const currentItem = list[currentAdIndex];
      setCurrentDisplay(() => currentItem);

      let seconds = 5; //currentAd.seconds
      if (
        currentItem.ads &&
        currentItem.type === AdsCurrentType.ADVERTISEMENT
      ) {
        seconds = currentItem.ads?.seconds; //currentItem?.data?.seconds || 5;
      } else {
        seconds = 5;
      }

      updateAdStats(currentAdIndex);

      const timer = setTimeout(() => {
        const nextIndex = (currentAdIndex + 1) % list.length;
        setAdvertisement(() => false);

        setCurrentAdIndex(nextIndex);

        if (preview === false) {
          sendAPI();
        }
      }, seconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [list, currentAdIndex, preview]);

  return (
    <div className={style?.container || "h-screen w-screen flex"}>
      {advertisement && <AdsSidebar theme={theme} />}
      {currentDisplay && (
        <DisplayContent
          item={currentDisplay}
          advertisement={advertisement}
          resources={{
            dolar,
            theme,
          }}
        />
      )}
    </div>
  );
}
