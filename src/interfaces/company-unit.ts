import { IApiUnitPopularTimeData } from "@/backend/api/api.interface";
import { IDay } from "./general";
import { faker } from "@faker-js/faker";

export enum CompanyUnitSortKey {
  name = "name",
  type = "type",
  status = "status",
  company = "company",
  full_address = "full_address",
  neighborhood = "neighborhood",
  address = "address",
  country = "country",
  street_number = "street_number",
  city = "city",
  state = "state",
  max_capacity = "max_capacity",
  created_at = "created_at",
  updated_at = "updated_at",
}

export enum CompanyUnitPriceSortKey {
  period = "period",
  display_times = "display_times",
  price_total = "price_total",
  seconds = "seconds",
  average_visitors = "average_visitors",
}

export function GenerateWeekData(): IApiUnitPopularTimeData[] {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    count: 0,
  }));

  return Object.values(IDay).map((day) => ({
    day,
    data: [...hours],
  }));
}

export function GenerateWeekData2(): Record<
  string,
  { hour: string; count: number }[]
> {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    count: 0,
  }));

  const weekData: Record<string, { hour: string; count: number }[]> = {};

  Object.values(IDay).forEach((day) => {
    weekData[day] = [...hours];
  });

  return weekData;
}
