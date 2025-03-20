export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export enum ContentAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
}

export interface IReactSelectOption {
  value: string;
  label: string;
}

export enum IToastType {
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
}

export enum IDay {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

export const TranslateDay = (day: IDay): string => {
  const translations: Record<IDay, string> = {
    [IDay.Monday]: "Segunda-feira",
    [IDay.Tuesday]: "Terça-feira",
    [IDay.Wednesday]: "Quarta-feira",
    [IDay.Thursday]: "Quinta-feira",
    [IDay.Friday]: "Sexta-feira",
    [IDay.Saturday]: "Sábado",
    [IDay.Sunday]: "Domingo",
  };

  return translations[day] || day;
};
