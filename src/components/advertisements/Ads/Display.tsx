"use client";

import { IApiDisplayResponseItem } from "@/backend/api/api.interface";

import React, { useState, useEffect } from "react";
import { AdsSidebar } from "./AdsSidebar";
import { DisplayContent } from "./DisplayContent";
import { AdsCurrentType, IDisplayTheme } from "@/interfaces/ads";
import { faker } from "@faker-js/faker";
import { addLogToQueue } from "@/backend/queue/display_logs_create";
import { DisplayLogStatus, DisplayType } from "@/interfaces/display-logs";
import { DateHelper } from "@/utils/date";
import useDisplayLogsQueue from "@/hooks/useDisplayLogsQueue";

interface AdStat {
  index: number;
  count: number;
  timestamps: string[];
}

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
  unit?: string | null;
  style?: {
    container?: string;
  };
}

export function Display({ list, theme, preview, style, unit }: IDisplay) {
  useDisplayLogsQueue();

  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [advertisement] = useState(false);
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
        seconds = currentItem.ads?.seconds || 20; //currentItem?.data?.seconds || 5;
      } else {
        seconds = 5;
      }

      updateAdStats(currentAdIndex);

      const timer = setTimeout(async () => {
        const nextIndex = (currentAdIndex + 1) % list.length;
        // setAdvertisement(() => false);

        setCurrentAdIndex(nextIndex);
        const currentId = currentDisplay?.ads?._id || currentDisplay?.news?._id;
        const currentSeconds = currentItem.ads?.seconds || 5;

        if (preview === false && unit && currentId) {
          await addLogToQueue({
            identifier: "",
            id: currentId,
            local: unit,
            type: DisplayType.ADVERTISEMENT,
            status: DisplayLogStatus.FINISHED,
            start_at: DateHelper.dayjs()
              .subtract(currentSeconds, "seconds")
              .toISOString(),
            end_at: DateHelper.dayjs().toISOString(),
          });
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
