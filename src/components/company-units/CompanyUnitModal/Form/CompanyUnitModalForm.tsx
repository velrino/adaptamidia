import React, { ReactNode, useCallback, useEffect, useState } from "react";
import Select from "react-select";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { ContentAction, IReactSelectOption } from "@/interfaces/general";
import {
  IApiCompaniesResponse,
  IApiCompanyResponse,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { CompanyStatusOptions } from "@/interfaces/company";
import { PiClockAfternoonThin } from "react-icons/pi";
import { DateHelper } from "@/utils/date";
import { ICompanyUnitModalPrincipalProps } from "../interface";
import { CompaniesResponseMock } from "@/backend/mock/client";
import { FormatBrazillianDocument } from "@/utils/generic";

export const CompanyUnitModalForm = ({
  action,
  data,
  onUpdate,
  formCompany,
}: // formReport,
// setFormReport,
ICompanyUnitModalPrincipalProps) => {
  const updateForm = (column: keyof IApiUnitItemResponse, value: unknown) => {
    onUpdate({ [column]: value });
  };

  const [companiesOptions, setCompaniesOptions] = useState<
    IReactSelectOption[]
  >([]);
  const [comapniesResponse, setCompaniesResponse] =
    useState<IApiCompaniesResponse>();

  const getResponse = useCallback(async () => {
    const currentResponse = CompaniesResponseMock;
    setCompaniesResponse(currentResponse);

    return new Promise<IApiCompanyResponse[]>((resolve) => {
      setTimeout(() => {
        resolve(currentResponse.data);
      }, 1);
    });
  }, []);

  useEffect(() => {
    getResponse();
  }, [getResponse]);

  const handleResponse = useCallback(async (): Promise<
    IApiCompanyResponse[]
  > => {
    return new Promise<IApiCompanyResponse[]>((resolve) => {
      setTimeout(() => {
        resolve(comapniesResponse?.data || []);
      }, 1);
    });
  }, [comapniesResponse]);

  useEffect(() => {
    if (!comapniesResponse) return;

    handleResponse().then((data) => {
      const tempResponse: IReactSelectOption[] = data.map((item) => ({
        value: item._id,
        label: `${item.name} (${FormatBrazillianDocument(item.document)})`,
      }));

      setCompaniesOptions(() => tempResponse);
    });
  }, [comapniesResponse, handleResponse]);

  const [companyStatusOptions, setCompanyStatusOptions] =
    useState<IReactSelectOption[]>(CompanyStatusOptions);

  useEffect(() => {
    setCompanyStatusOptions(CompanyStatusOptions);
  }, []);

  // Apply debounce to handleCompanyDocument function, delaying execution by 300ms
  // const handleCompanyDocumentDebounced = debounce(handleCompanyDocument, 300);

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
      <div className="grid gap-6 sm:grid-cols-2">
        {data && (
          <>
            <div>
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
            <div>
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
              />
            </div>
            <div className="col-span-2">
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
            <div>
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
            <div></div>
            <div>
              <Label htmlFor="devices">Dispositivos</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Informe o número"
                id="devices"
                value={data?.devices?.smart_tv || ""}
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
            <div></div>
            <div>
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
              <div className="col-span-2">
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
