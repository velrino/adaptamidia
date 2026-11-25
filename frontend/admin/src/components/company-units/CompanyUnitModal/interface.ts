import { IApiUnitItemResponse } from "@/backend/api/api.interface";
import { ContentAction } from "@/interfaces/general";

export interface ICompanyUnitModalCommonProps {
  action: ContentAction;
  data: IApiUnitItemResponse;
  onUpdate: (data: Partial<IApiUnitItemResponse>) => void;
  formReport: ICompanyUnitDefaultFormReport;
  setFormReport: React.Dispatch<
    React.SetStateAction<ICompanyUnitDefaultFormReport>
  >;
}

export interface ICompanyUnitModalPrincipalProps
  extends ICompanyUnitModalCommonProps {
  formCompany: {
    companySelected: string | null;
    setCompanySelected: React.Dispatch<React.SetStateAction<string | null>>;
  };
}

export interface ICompanyUnitDefaultFormReport {
  name: string;
}

export const CompanyUnitDefaultFormReport: ICompanyUnitDefaultFormReport = {
  name: String(),
};
