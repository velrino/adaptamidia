import { IReactSelectOption } from "./general";

export enum CompanySortKey {
  document = "document",
  document_type = "document_type",
  name = "name",
  type = "type",
  status = "status",
  created_at = "created_at",
  updated_at = "updated_at",
}

export enum ICompanyType {
  LOCAL = "LOCAL",
  ADVERTISER = "ADVERTISER",
}

export const CompanyTypesOptions: IReactSelectOption[] = [
  { value: ICompanyType.ADVERTISER, label: "Anunciante" },
  { value: ICompanyType.LOCAL, label: "Local" },
].sort((a, b) => a.label.localeCompare(b.label));

export enum ICompanyDocumentType {
  CNPJ = "CNPJ",
  CPF = "CPF",
}

export const CompanyDocumentTypesOptions: IReactSelectOption[] = [
  { value: ICompanyDocumentType.CNPJ, label: "CNPJ" },
  { value: ICompanyDocumentType.CPF, label: "CPF" },
].sort((a, b) => a.label.localeCompare(b.label));

export enum ICompanyStatus {
  ACTIVE = "ACTIVE",
  IN_REVIEW = "IN_REVIEW",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  TEST = "TEST",
}

export const CompanyStatusOptions: IReactSelectOption[] = [
  { value: ICompanyStatus.ACTIVE, label: "Ativo" },
  { value: ICompanyStatus.IN_REVIEW, label: "Em revisão" },
  { value: ICompanyStatus.INACTIVE, label: "Inativo" },
  { value: ICompanyStatus.PENDING, label: "Pendente" },
  { value: ICompanyStatus.TEST, label: "Teste" },
].sort((a, b) => a.label.localeCompare(b.label));
