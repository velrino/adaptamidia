"use client";

import {
  IApiAdvertisementItem,
  IApiNewsResponseItem,
} from "@/backend/api/api.interface";

import React, { useState, useEffect } from "react";
import { AdsSidebar } from "./AdsSidebar";
import { DisplayContent } from "./DisplayContent";
import {
  AdsCurrentType,
  IAdsCurrentItem,
  IDisplayTheme,
} from "@/interfaces/ads";
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
  list: IAdsCurrentItem[];
  theme: IDisplayTheme;
  preview: boolean;
}

export function Display({ list, theme, preview }: IDisplay) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [advertisement, setAdvertisement] = useState(false);
  const [dolar, setDolar] = useState<number>(0);

  const [currentDisplay, setCurrentDisplay] = useState<IAdsCurrentItem>();

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

      let seconds = 3; //currentAd.seconds
      if (currentItem.type === AdsCurrentType.ADVERTISEMENT) {
        currentItem.data = currentItem.data as IApiAdvertisementItem;
        seconds = 3; //currentItem?.data?.seconds || 5;
      }

      if (currentItem.type === AdsCurrentType.NEWS) {
        currentItem.data = currentItem.data as IApiNewsResponseItem;
      }

      updateAdStats(currentAdIndex);

      console.clear();
      console.log({ list });

      const timer = setTimeout(() => {
        const nextIndex = (currentAdIndex + 1) % list.length;
        setAdvertisement(() => false);

        setCurrentAdIndex(nextIndex);

        if (!preview) {
          sendAPI();
        }
      }, seconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [list, currentAdIndex, preview]);

  return (
    <div className="h-screen w-screen flex">
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
