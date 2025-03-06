import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);

export enum DateHelperFormat {
  NORMAL = "NORMAL",
  SHORT = "SHORT",
  TIME = "TIME",
}

export const DateHelper = {
  dayjs,
  formats: {
    NORMAL: "DD/MM/YYYY HH:mm:ss",
    SHORT: "DD/MM/YYYY",
    TIME: "HH:mm:ss",
  },
  format: (
    date: string | Date,
    format: DateHelperFormat = DateHelperFormat.NORMAL
  ) => {
    return dayjs(date).format(
      DateHelper.formats[format as keyof typeof DateHelper.formats] || format
    );
  },
  parse: (
    dateString: string,
    format: DateHelperFormat = DateHelperFormat.NORMAL
  ) => {
    return dayjs(dateString, format);
  },
  addDays: (date: string | Date, days: number) => {
    return dayjs(date).add(days, "day");
  },
  subtractDays: (date: string | Date, days: number) => {
    return dayjs(date).subtract(days, "day");
  },
  isBefore: (date1: string | Date, date2: string | Date) => {
    return dayjs(date1).isBefore(date2);
  },
  isAfter: (date1: string | Date, date2: string | Date) => {
    return dayjs(date1).isAfter(date2);
  },
  diff: (
    date1: string | Date,
    date2: string | Date,
    unit: dayjs.OpUnitType = "day"
  ) => {
    return dayjs(date1).diff(date2, unit);
  },
  formatMilliseconds: (ms?: number) => {
    if (!ms) return "0s"; // Retorna "0s" se for undefined ou 0

    const time = dayjs.duration(ms);
    const days = time.days();
    const hours = time.hours();
    const minutes = time.minutes();
    const seconds = time.seconds();

    const result = [];
    if (days > 0) result.push(`${days}d`);
    if (hours > 0 || days > 0) result.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0) result.push(`${minutes}m`);
    result.push(`${seconds}s`);

    return result.join(" ");
  },
  timeAgo: (date: string | Date) => {
    return dayjs(date).fromNow();
  },
};

export enum DaysOfWeek {
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
}

export const DaysOfWeekTranslations = {
  [DaysOfWeek.SUNDAY]: "Domingo",
  [DaysOfWeek.MONDAY]: "Segunda-feira",
  [DaysOfWeek.TUESDAY]: "Terça-feira",
  [DaysOfWeek.WEDNESDAY]: "Quarta-feira",
  [DaysOfWeek.THURSDAY]: "Quinta-feira",
  [DaysOfWeek.FRIDAY]: "Sexta-feira",
  [DaysOfWeek.SATURDAY]: "Sábado",
};

export const DateInputStyle = {
  tradicional:
    "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800",
  calendar:
    "absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400",
};
