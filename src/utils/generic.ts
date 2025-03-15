/* eslint-disable @typescript-eslint/no-explicit-any */

import { IApiUnitItemResponse } from "@/backend/api/api.interface";
import { AdPeriod } from "@/interfaces/ads";

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
