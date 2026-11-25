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
  const [rotation, setRotation] = useState(0);
  const [currentDisplay, setCurrentDisplay] =
    useState<IApiDisplayResponseItem>();
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [totalTime, setTotalTime] = useState(5);
  const [cameraStatus, setCameraStatus] = useState<"starting" | "ready" | "unavailable">("starting");
  const currentAdIndex = list.length ? rotation % list.length : 0;
  const cameraEnabled = Boolean(useWebcam && unit && !preview);

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
        const captureId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const body: IApiCreateDisplayLogRequest = {
          identifier: captureId,
          id: currentId,
          local: unit,
          type: item.ads ? DisplayType.ADVERTISEMENT : DisplayType.NEWS,
          status: DisplayLogStatus.FINISHED,
          start_at: DateHelper.dayjs()
            .subtract(displaySeconds, "seconds")
            .toISOString(),
          end_at: DateHelper.dayjs().toISOString(),
        };
        let capture: Blob | null | undefined;
        try {
          if (cameraEnabled) capture = await webcamRef.current?.captureFrame();
        } catch (error) {
          console.error("Falha ao capturar imagem da câmera:", error);
        }
        try {
          await addLogToQueue({ ...body, capture: capture ?? undefined });
        } catch (error) {
          console.error("Failed to send log:", error);
        }
      }
    },
    [preview, unit, cameraEnabled]
  );

  // Main display rotation effect
  useEffect(() => {
    if (!list.length) return;

    const displaySeconds = currentItem.ads?.seconds ? 3 : 5;

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

      setRotation((previous) => previous + 1);
    }, displaySeconds * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [list, rotation, currentAdIndex, currentItem, preview, sendLog]);

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
      {cameraEnabled && <HiddenWebcam ref={webcamRef} onStatusChange={setCameraStatus} />}
      {cameraEnabled && cameraStatus === "unavailable" && (
        <p role="status" className="fixed bottom-4 left-4 rounded bg-black/75 px-3 py-2 text-sm text-white">
          Câmera indisponível. Verifique a permissão do navegador.
        </p>
      )}
    </div>
  );
}
