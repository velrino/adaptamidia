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
