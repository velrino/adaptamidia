import React, { ReactNode, useCallback, useEffect, useState } from "react";
import Select from "react-select";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  ContentAction,
  IReactSelectOption,
  IToastType,
} from "@/interfaces/general";
import {
  IApiCompaniesResponse,
  IApiPaginateCompanies,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { CompanyStatusOptions } from "@/interfaces/company";
import { PiClockAfternoonThin } from "react-icons/pi";
import { DateHelper } from "@/utils/date";
import { ICompanyUnitModalPrincipalProps } from "../interface";
import { FormatBrazillianDocument, GetErrorMessage } from "@/utils/generic";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { API } from "@/backend/api/api.endpoints";
import { CompanyUnitTypeOptions } from "@/interfaces/company-unit";
import Spinner from "@/components/ui/spinner/Spinner";
import dynamic from "next/dynamic";

const LazyMap = dynamic(
  () => import("../../../advertisements/AdvertisementModal/Ads/Map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner color="#465fff" />
      </div>
    ),
  }
);
export const CompanyUnitModalForm = ({
  action,
  data,
  onUpdate,
  formCompany,
}: // formReport,
// setFormReport,
ICompanyUnitModalPrincipalProps) => {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const updateForm = (column: keyof IApiUnitItemResponse, value: unknown) => {
    onUpdate({ [column]: value });
  };

  const [companiesOptions, setCompaniesOptions] = useState<
    IReactSelectOption[]
  >([]);
  const [comapniesResponse, setCompaniesResponse] =
    useState<IApiCompaniesResponse>();

  const [companySearchTerm, setCompanySearchTerm] = useState(String());
  const getCompanyResponse = useCallback(
    async (apiQuery: IApiPaginateCompanies) => {
      if (!session?.api_session) {
        return;
      }

      try {
        const query: IApiPaginateCompanies = {
          page: 1,
          limit: 20,
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
      }
    },
    [session?.api_session, showToast]
  );

  useEffect(() => {
    getCompanyResponse({});
  }, [getCompanyResponse]);

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

  const [companyStatusOptions, setCompanyStatusOptions] =
    useState<IReactSelectOption[]>(CompanyStatusOptions);

  useEffect(() => {
    setCompanyStatusOptions(CompanyStatusOptions);
  }, []);

  const [companyUnitTypeOptions] = useState<IReactSelectOption[]>(
    CompanyUnitTypeOptions
  );

  const MetricItem = useCallback(
    ({
      label,
      value,
      icon,
    }: {
      label: string;
      value: string;
      icon: ReactNode;
    }) => (
      <div className="flex flex-col flex-1 min-w-0 items-start text-gray-600 dark:text-gray-300 border-l first:border-l-0 pl-3 first:pl-0">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm  font-bold">{label}</span>
        </div>
        <div>{value}</div>
      </div>
    ),
    []
  );

  return (
    <div className="overflow-y-auto min-h-[75vh] max-h-[75vh] px-6">
      <div className="grid gap-6 sm:grid-cols-12">
        {data && (
          <>
            <div className="col-span-6">
              <Label htmlFor="name">Nome</Label>
              <Input
                type="text"
                placeholder="Informe o nome"
                id="title"
                value={data.name}
                onChange={(e) => updateForm("name", e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="col-span-6">
              <Label htmlFor="title">Empresa</Label>
              <Select
                placeholder={`Selecione a empresa`}
                // isDisabled={isAdvertiserLoading}
                // isLoading={isAdvertiserLoading}
                value={
                  companiesOptions.find(
                    (option) => option.value === formCompany?.companySelected
                  ) || null
                }
                options={companiesOptions}
                onChange={(currentOption) =>
                  formCompany?.setCompanySelected(
                    currentOption ? currentOption.value : null
                  )
                }
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
            </div>
            <div className="col-span-12">
              <Label htmlFor="name">Endereço</Label>
              <Input
                type="text"
                placeholder="Informe o endereço"
                id="full_address"
                value={data.full_address}
                onChange={(e) => updateForm("full_address", e.target.value)}
                maxLength={100}
              />
            </div>
            {action !== ContentAction.CREATE && (
              <>
                <div className="col-span-3">
                  <Label htmlFor="name">País</Label>
                  <Input
                    type="text"
                    disabled
                    placeholder="Informe a cidade"
                    id="stacountryte"
                    value={data.country}
                    onChange={(e) => updateForm("country", e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="name">Estado</Label>
                  <Input
                    type="text"
                    placeholder="Informe a cidade"
                    id="state"
                    disabled
                    value={data.state}
                    onChange={(e) => updateForm("state", e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="name">Cidade</Label>
                  <Input
                    type="text"
                    placeholder="Informe a cidade"
                    id="city"
                    disabled
                    value={data.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="name">Bairro</Label>
                  <Input
                    type="text"
                    placeholder="Informe o endereço"
                    disabled
                    id="neighborhood"
                    value={data.neighborhood}
                    onChange={(e) => updateForm("neighborhood", e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="name">Número</Label>
                  <Input
                    type="text"
                    placeholder="Informe o número"
                    disabled
                    id="street_number"
                    value={data.street_number}
                    onChange={(e) =>
                      updateForm("street_number", e.target.value)
                    }
                    maxLength={100}
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    type="text"
                    placeholder="Informe o complemento"
                    id="complement"
                    value={data.complement}
                    onChange={(e) => updateForm("complement", e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="col-span-12">
                  <LazyMap
                    list={[data]}
                    key={`map-units-${data._id}-${new Date().toISOString()}`}
                    style={{ minHeight: 250 }}
                    enableClickPopUp={false}
                    customMapContainer={{
                      dragging: false,
                      doubleClickZoom: false,
                      closePopupOnClick: false,
                      zoomSnap: 0,
                      zoomDelta: 0,
                      trackResize: false,
                      touchZoom: false,
                      scrollWheelZoom: false,
                    }}
                  />
                </div>
              </>
            )}
            <div className="col-span-3">
              <Label htmlFor="title">Tipo</Label>
              <Select
                placeholder={`Selecione o tipo`}
                // isDisabled={isAdvertiserLoading}
                // isLoading={isAdvertiserLoading}
                value={
                  companyUnitTypeOptions.find(
                    (option) => option.value === data.type
                  ) || null
                }
                options={companyUnitTypeOptions}
                onChange={(currentOption) =>
                  updateForm("type", currentOption ? currentOption.value : null)
                }
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor="title">Status</Label>
              <Select
                placeholder={`Selecione o status`}
                // isDisabled={isAdvertiserLoading}
                // isLoading={isAdvertiserLoading}
                value={
                  companyStatusOptions.find(
                    (option) => option.value === data.status
                  ) || null
                }
                options={companyStatusOptions}
                onChange={(currentOption) =>
                  updateForm(
                    "status",
                    currentOption ? currentOption.value : null
                  )
                }
              />
            </div>

            <div className="col-span-3">
              <Label htmlFor="devices">Dispositivos</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Informe o número"
                id="devices"
                value={data?.devices?.smart_tv || "0"}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    onUpdate({
                      ...data,
                      devices: {
                        ...data.devices,
                        smart_tv: Number(value),
                      },
                    });
                  }
                }}
                maxLength={5}
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor="max_capacity">Máximo de capacidade</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Informe o número"
                id="max_capacity"
                value={data?.max_capacity || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    onUpdate({
                      max_capacity: Number(value),
                    });
                  }
                }}
                maxLength={5}
              />
            </div>
            {action !== ContentAction.CREATE && (
              <div className="col-span-12">
                <div className="w-full">
                  <div className="flex flex-row w-full gap-3">
                    {data.created_at && (
                      <MetricItem
                        label={`Criado em:`}
                        value={`${DateHelper.format(
                          data.created_at
                        )} - ${DateHelper.timeAgo(data.created_at)}`}
                        icon={<PiClockAfternoonThin size={15} />}
                      />
                    )}
                    {data.updated_at && (
                      <MetricItem
                        label={`Atualizado em:`}
                        value={`${DateHelper.format(
                          data.updated_at
                        )} - ${DateHelper.timeAgo(data.updated_at)}`}
                        icon={<PiClockAfternoonThin size={15} />}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
