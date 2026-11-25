import { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import {
  IApiCompaniesResponse,
  IApiPaginateCompanies,
} from "@/backend/api/api.interface";
import { FormatBrazillianDocument, GetErrorMessage } from "@/utils/generic";
import { API } from "@/backend/api/api.endpoints";
import { IReactSelectOption, IToastType } from "@/interfaces/general";

interface CompanySelectProps {
  value: string | null;
  queryBuilder: IApiPaginateCompanies;
  onChange: (companyId: string | null) => void;
}

export const CompanySelect = ({
  value,
  onChange,
  queryBuilder,
}: CompanySelectProps) => {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [companySearchTerm, setCompanySearchTerm] = useState(String());
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(false);
  const [comapniesResponse, setCompaniesResponse] =
    useState<IApiCompaniesResponse>();

  const getCompanyResponse = useCallback(
    async (apiQuery: IApiPaginateCompanies) => {
      if (!session?.api_session) {
        return;
      }

      try {
        setIsCompaniesLoading(true);
        const query: IApiPaginateCompanies = {
          page: 1,
          limit: 20,
          ...queryBuilder,
          ...apiQuery,
        };

        const response = await API.companies.paginate(
          session.api_session.access_token,
          query
        );

        const data = await response.json();

        if (data?.error) {
          showToast(GetErrorMessage(data.error), IToastType.ERROR);
        } else if (response.ok) {
          setCompaniesResponse(data);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
        setIsCompaniesLoading(false);
      }
    },
    [session?.api_session, showToast]
  );

  useEffect(() => {
    getCompanyResponse({});
  }, [getCompanyResponse]);

  const [companiesOptions, setCompaniesOptions] = useState<
    IReactSelectOption[]
  >([]);

  useEffect(() => {
    if (!comapniesResponse) return;

    const tempResponse: IReactSelectOption[] = comapniesResponse?.data
      .map((item) => ({
        value: item._id,
        label: `${item.name} (${FormatBrazillianDocument(item.document)})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    setCompaniesOptions(() => tempResponse);
  }, [comapniesResponse]);

  return (
    <Select
      placeholder={`Selecione`}
      isDisabled={isCompaniesLoading}
      isLoading={isCompaniesLoading}
      value={companiesOptions.find((option) => option.value === value) || null}
      options={companiesOptions}
      onChange={(currentOption) => {
        onChange(currentOption?.value || null);
        // setInputValue(""); // Limpa o input após seleção
      }}
      onInputChange={(inputValue) => {
        setCompanySearchTerm(inputValue);
        return inputValue;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          getCompanyResponse({
            name: companySearchTerm,
            page: 1,
          });
        }
      }}
    />
  );
};
