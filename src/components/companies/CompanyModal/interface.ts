import { IApiCompanyResponse } from "@/backend/api/api.interface";
import { ContentAction } from "@/interfaces/general";

export interface ICompanyModalCommonProps {
  action: ContentAction;
  data: IApiCompanyResponse;
  onUpdate: (data: Partial<IApiCompanyResponse>) => void;
  formReport: ICompanyDefaultFormReport;
  setFormReport: React.Dispatch<
    React.SetStateAction<ICompanyDefaultFormReport>
  >;
}

export interface ICompanyDefaultFormReport {
  document: string;
}

export const CompanyDefaultFormReport: ICompanyDefaultFormReport = {
  document: String(),
};
