"use client";

import {
  IApiCreateDisplayLogRequest,
  IApiDisplayResponseItem,
} from "@/backend/api/api.interface";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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

interface IDisplay {
  list: IApiDisplayResponseItem[];
  theme: IDisplayTheme;
  preview: boolean;
  unit?: string | null;
  style?: {
    container?: string;
  };
}

const DEFAULT_AD_SECONDS = 20;
const DEFAULT_NEWS_SECONDS = 5;
const LOG_TIMEOUT_MS = 100;
const DOLAR_RANGE = { min: 5.7, max: 5.9, fractionDigits: 2 };

const updateAdStats = (adIndex: number): void => {
  const stats: AdStat[] = JSON.parse(
    localStorage.getItem("adStats") || "[]"
  ) as AdStat[];
  const adStatIndex = stats.findIndex((stat) => stat.index === adIndex);

  const now = new Date().toISOString();

  if (adStatIndex > -1) {
    stats[adStatIndex].count += 1;
    stats[adStatIndex].timestamps.push(now);
  } else {
    stats.push({
      index: adIndex,
      count: 1,
      timestamps: [now],
    });
  }

  localStorage.setItem("adStats", JSON.stringify(stats));
};

export function Display({ list, theme, preview, style, unit }: IDisplay) {
  useDisplayLogsQueue();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [dolar, setDolar] = useState<number>(0);
  const [currentDisplay, setCurrentDisplay] =
    useState<IApiDisplayResponseItem>();

  // Memoized current item to avoid recalculations
  const currentItem = useMemo(
    () => list[currentAdIndex],
    [list, currentAdIndex]
  );

  // Generate random dolar value once on mount
  useEffect(() => {
    setDolar(faker.number.float(DOLAR_RANGE));
  }, []);

  const sendLog = useCallback(
    async (item: IApiDisplayResponseItem, displaySeconds: number) => {
      const currentId = item.ads?._id || item.news?._id;

      if (preview === false && unit && currentId) {
        const body: IApiCreateDisplayLogRequest = {
          identifier: "",
          id: currentId,
          local: unit,
          type: currentItem.ads ? DisplayType.ADVERTISEMENT : DisplayType.NEWS,
          status: DisplayLogStatus.FINISHED,
          start_at: DateHelper.dayjs()
            .subtract(displaySeconds, "seconds")
            .toISOString(),
          end_at: DateHelper.dayjs().toISOString(),
        };
        try {
          await Promise.race([
            addLogToQueue(body)
              .then((res) => ({ success: true, res }))
              .catch((err) => ({ success: false, err })),
            new Promise((resolve) =>
              setTimeout(
                () => resolve({ success: false, reason: "timeout" }),
                LOG_TIMEOUT_MS
              )
            ),
          ]);
        } catch (error) {
          console.error("Failed to send log:", error);
        }
      }
    },
    [preview, unit, currentItem]
  );

  // Main display rotation effect
  useEffect(() => {
    if (!list.length) return;

    setCurrentDisplay(currentItem);
    updateAdStats(currentAdIndex);

    const isAd =
      currentItem.ads && currentItem.type === AdsCurrentType.ADVERTISEMENT;
    const displaySeconds = isAd
      ? currentItem.ads?.seconds || DEFAULT_AD_SECONDS
      : DEFAULT_NEWS_SECONDS;

    const timer = setTimeout(async () => {
      if (!preview) {
        await sendLog(currentItem, displaySeconds);
      }

      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % list.length);
    }, displaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [list, currentAdIndex, currentItem, preview, sendLog]);

  if (!currentDisplay) return null;

  return (
    <div className={style?.container || "h-screen w-screen flex"}>
      <DisplayContent
        item={currentDisplay}
        advertisement={false}
        resources={{
          dolar,
          theme,
        }}
      />
    </div>
  );
}
