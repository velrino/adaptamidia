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
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export const TranslateDay = (day: IDay): string => {
  const translations: Record<IDay, string> = {
    [IDay.MONDAY]: "Segunda-feira",
    [IDay.TUESDAY]: "Terça-feira",
    [IDay.WEDNESDAY]: "Quarta-feira",
    [IDay.THURSDAY]: "Quinta-feira",
    [IDay.FRIDAY]: "Sexta-feira",
    [IDay.SATURDAY]: "Sábado",
    [IDay.SUNDAY]: "Domingo",
  };

  return translations[day] || day;
};

export enum FromEnum {
  DATABASE = "DATABASE",
  CACHE = "CACHE",
}
