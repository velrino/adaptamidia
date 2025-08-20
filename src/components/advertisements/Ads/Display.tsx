"use client";

import {
  IApiCreateDisplayLogRequest,
  IApiCurrencyResponse,
  IApiDisplayResponseItem,
  IApiWeatherResponse,
} from "@/backend/api/api.interface";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { DisplayContent } from "./DisplayContent";
import { IDisplayTheme } from "@/interfaces/ads";
import { addLogToQueue } from "@/backend/queue/display_logs_create";
import { DisplayLogStatus, DisplayType } from "@/interfaces/display-logs";
import { DateHelper } from "@/utils/date";
import useDisplayLogsQueue from "@/hooks/useDisplayLogsQueue";
import HiddenWebcam, {
  HiddenWebcamHandle,
} from "@/components/webcam/HiddenWebcam";
import { API } from "@/backend/api/api.endpoints";

interface AdStat {
  index: number;
  count: number;
  timestamps: string[];
}

interface IDisplay {
  list: IApiDisplayResponseItem[];
  theme: IDisplayTheme;
  preview: boolean;
  currency?: IApiCurrencyResponse;
  weather?: IApiWeatherResponse;
  unit?: string | null;
  useWebcam?: boolean;
  style?: {
    container?: string;
  };
}

const LOG_TIMEOUT_MS = 100;

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

export function Display({
  list,
  theme,
  preview,
  style,
  unit,
  currency,
  weather,
  useWebcam,
}: IDisplay) {
  useDisplayLogsQueue();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentDisplay, setCurrentDisplay] =
    useState<IApiDisplayResponseItem>();
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [totalTime, setTotalTime] = useState(5);

  // Memoized current item to avoid recalculations
  const currentItem = useMemo(
    () => list[currentAdIndex],
    [list, currentAdIndex]
  );

  const webcamRef = useRef<HiddenWebcamHandle>(null);

  const sendLog = useCallback(
    async (item: IApiDisplayResponseItem, displaySeconds: number) => {
      const currentId = item.ads?._id || item.news?._id;

      if (preview === false && unit && currentId) {
        const captureId: string = Date.now().toString();

        const body: IApiCreateDisplayLogRequest = {
          identifier: captureId,
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

          // Captura o frame do webcam
          let frame = null;
          if (
            useWebcam &&
            webcamRef.current &&
            typeof webcamRef.current.captureFrame === "function"
          ) {
            frame = await webcamRef.current.captureFrame();
            if (frame) {
              await API.files.uploadCamera({
                file: frame,
                type: item.type,
                record: String(currentId),
                unit: String(unit),
                timestamp: captureId,
              });
            }
          }
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

    const displaySeconds = currentItem.ads?.seconds || 5;

    setTotalTime(displaySeconds);
    setCurrentDisplay(currentItem);
    updateAdStats(currentAdIndex);
    setTimeRemaining(displaySeconds);

    // Timer para countdown
    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0.1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    const timer = setTimeout(async () => {
      clearInterval(countdownInterval);

      if (!preview) {
        await sendLog(currentItem, displaySeconds);
      }

      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % list.length);
    }, displaySeconds * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [list, currentAdIndex, currentItem, preview, sendLog]);

  if (!currentDisplay) return null;

  return (
    <div className={style?.container || "h-screen w-screen flex"}>
      <DisplayContent
        item={currentDisplay}
        advertisement={false}
        resources={{
          currency,
          weather,
          theme,
        }}
      />
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gray-300">
        <div
          className="h-full bg-blue-500 transition-all duration-100 ease-linear"
          style={{
            width: `${((totalTime - timeRemaining) / totalTime) * 100}%`,
          }}
        />
      </div>
      {/* Webcam invisível, apenas para captura de frame */}
      {useWebcam && <HiddenWebcam ref={webcamRef} />}
    </div>
  );
}
