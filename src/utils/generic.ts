/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  IApiDashboardDisplayLogRecord,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { AdPeriod, AdsCurrentType } from "@/interfaces/ads";
import { DateHelper } from "./date";

export function ShuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function SumByPath(array: any[], path: string) {
  return array.reduce((sum, item) => {
    const value = path.split(".").reduce((acc, key) => acc?.[key], item) || 0;
    return sum + value;
  }, 0);
}

export function SumByKey<T>(
  data: T[][],
  filterKey: keyof T,
  sumKey: keyof T
): number {
  return data
    .flat() // Junta todos os arrays internos em um único array
    .filter((item) => item[filterKey]) // Filtra itens válidos pelo critério passado
    .reduce((sum, item) => sum + (Number(item[sumKey]) || 0), 0); // Soma os valores
}

export function SumUnitPeriodNative(
  units: IApiUnitItemResponse[],
  period: AdPeriod,
  keyToSum: keyof IApiUnitItemResponse["prices"][0]
): number {
  return units.reduce((sum, unit) => {
    return (
      sum +
      unit.prices.reduce(
        (acc, price) =>
          price.period === period ? acc + Number(price[keyToSum]) : acc,
        0
      )
    );
  }, 0);
}

export function FormatCurrency(
  value: number,
  currency: string = "BRL",
  locale: string = "pt-BR"
): string {
  return value.toLocaleString(locale, {
    style: "currency",
    currency: currency,
  });
}

export function FormatThousand(value: number): string {
  return value.toLocaleString("pt-BR");
}

export function GenerateNumberRange(
  min: number,
  max: number,
  step: number = 5
): number[] {
  return Array.from(
    { length: (max - min) / step + 1 },
    (_, i) => min + i * step
  );
}

export function GenerateNumberRangeAsOptions(
  min: number,
  max: number,
  interval: number = 5
) {
  return GenerateNumberRange(min, max, interval).map((value) => ({
    value: value.toString(),
    label: `${value} segundos`,
  }));
}

export const FormatBrazillianDocument = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "");

  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  } else {
    return cleanValue
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
};

export const Environment = {
  isProduction: process.env.NEXT_PUBLIC_ENVIRONMENT === "production",
};

export function GetErrorMessage(error: unknown, fallback = "FAILED"): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export const GetExtensionFromMimeType = (mime: string): string => {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/svg+xml": "svg",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
    "video/quicktime": "mov",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "text/plain": "txt",
    "application/json": "json",
  };

  return map[mime] || "bin";
};

export function Milliseconds({
  minutes = 0,
  seconds = 0,
  hours = 0,
}: {
  minutes?: number;
  seconds?: number;
  hours?: number;
}): number {
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

export function MissingDatesForChart(
  records: IApiDashboardDisplayLogRecord[],
  count: number,
  type: AdsCurrentType,
  unit: "day" | "month" = "day"
): IApiDashboardDisplayLogRecord[] {
  const format = unit === "month" ? "YYYY-MM" : "YYYY-MM-DD";

  // Mapa para acesso rápido aos existentes
  const existingMap = new Map(
    records.map((item) => [
      DateHelper.dayjs(item._id.start_at).format(format),
      item,
    ])
  );

  // Encontra a data mais recente nos registros existentes
  const mostRecentDate =
    records
      .map((r) => DateHelper.dayjs(r._id.start_at))
      .sort((a, b) => b.diff(a))?.[0] ?? DateHelper.dayjs();

  const fullList: IApiDashboardDisplayLogRecord[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const date = mostRecentDate.subtract(i, unit).format(format);

    if (existingMap.has(date)) {
      fullList.push(existingMap.get(date)!);
    } else {
      fullList.push({
        _id: {
          type,
          start_at: date,
        },
        total: 0,
      });
    }
  }

  return fullList;
}
