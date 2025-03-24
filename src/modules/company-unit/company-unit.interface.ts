import { CompanyUnit } from './company-unit.schema';

export enum CompanyUnitType {
  BAR = 'BAR',
  RESTAURANT = 'RESTAURANT', // Restaurante
  BAKERY = 'BAKERY', // Padaria
  GYM = 'GYM', // Academia
  OFFICE = 'OFFICE', // Escritório comercial
}

export enum CompanyUnitStatus {
  ACTIVE = 'ACTIVE',
  IN_REVIEW = 'IN_REVIEW',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  TEST = 'TEST',
}

export enum IDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export const CompanyUnitPrepareData = (item: CompanyUnit) => {
  return {
    ...item,
    prices: [],
  };
};
