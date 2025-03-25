import { Document } from 'mongoose';
import { Company } from './company.schema';

export type ICompany = Document & Company;

export enum CompanyDocumentType {
  CNPJ = 'CNPJ',
  CPF = 'CPF',
}

export enum CompanyType {
  ADVERTISER = 'ADVERTISER',
  LOCAL = 'LOCAL',
  SUDO = 'SUDO',
}
