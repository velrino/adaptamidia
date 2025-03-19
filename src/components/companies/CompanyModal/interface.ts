import { IApiCompanyResponse } from "@/backend/api/api.interface";

export interface ICompanyModalCommonProps {
  data: IApiCompanyResponse;
  onUpdate: (data: Partial<IApiCompanyResponse>) => void;
}

export interface ICompanyDefaultFormReport {
  document: string;
}

export const CompanyDefaultFormReport: ICompanyDefaultFormReport = {
  document: String(),
};
