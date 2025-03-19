import React, { ReactNode, useCallback, useEffect, useState } from "react";
import Select from "react-select";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { isCPF, isCNPJ } from "validation-br";
import { ContentAction, IReactSelectOption } from "@/interfaces/general";
import { ICompanyModalCommonProps } from "../interface";
import { IApiCompanyResponse } from "@/backend/api/api.interface";
import {
  CompanyDocumentTypesOptions,
  CompanyStatusOptions,
  CompanyTypesOptions,
  ICompanyDocumentType,
} from "@/interfaces/company";
import { FormatBrazillianDocument } from "@/utils/generic";
import { PiClockAfternoonThin } from "react-icons/pi";
import { DateHelper } from "@/utils/date";

export const CompanyModalForm = ({
  action,
  data,
  onUpdate,
  formReport,
  setFormReport,
}: ICompanyModalCommonProps) => {
  const updateForm = (column: keyof IApiCompanyResponse, value: unknown) => {
    onUpdate({ [column]: value });
  };

  const [companyTypeOptions, setCompanyTypeOptions] =
    useState<IReactSelectOption[]>(CompanyTypesOptions);

  const [companyDocumentTypeOptions, setCompanyDocumentTypeOptions] = useState<
    IReactSelectOption[]
  >(CompanyDocumentTypesOptions);

  const [companyStatusOptions, setCompanyStatusOptions] =
    useState<IReactSelectOption[]>(CompanyStatusOptions);

  useEffect(() => {
    setCompanyTypeOptions(CompanyTypesOptions);
    setCompanyDocumentTypeOptions(CompanyDocumentTypesOptions);
    setCompanyStatusOptions(CompanyStatusOptions);
  }, []);

  const handleCompanyDocument = (value: string) => {
    const formattedValue = FormatBrazillianDocument(value);
    const cleanValue = value.replace(/\D/g, "");

    updateForm("document", formattedValue);

    if (!cleanValue) {
      setFormReport((prev) => ({ ...prev, document: "" }));
      updateForm("document_type", null);
      return;
    }

    if (isCPF(cleanValue)) {
      updateForm("document_type", ICompanyDocumentType.CPF);
      setFormReport((prev) => ({ ...prev, document: "" }));
    } else if (isCNPJ(cleanValue)) {
      updateForm("document_type", ICompanyDocumentType.CNPJ);
      setFormReport((prev) => ({ ...prev, document: "" }));
    } else {
      updateForm("document_type", null);
      setFormReport((prev) => ({ ...prev, document: "Documento inválido" }));
    }
  };

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
              <Label htmlFor="title">Tipo de empresa</Label>
              <Select
                placeholder={`Selecione o Tipo de empresa`}
                // isDisabled={isAdvertiserLoading}
                // isLoading={isAdvertiserLoading}
                value={
                  companyTypeOptions.find(
                    (option) => option.value === data.type
                  ) || null
                }
                options={companyTypeOptions}
                onChange={(currentOption) =>
                  updateForm("type", currentOption ? currentOption.value : null)
                }
              />
            </div>
            <div>
              <Label htmlFor="document">Documento</Label>
              <Input
                type="text"
                placeholder="Informe o documento"
                id="document"
                value={data.document}
                onChange={(e) => handleCompanyDocument(e.target.value)}
                maxLength={18}
              />
              <div className="text-sm text-red-500">{formReport.document}</div>
            </div>
            <div>
              <Label htmlFor="title">Tipo de documento</Label>
              <Select
                placeholder={`Selecione o tipo de documento`}
                // isDisabled={isAdvertiserLoading}
                // isLoading={isAdvertiserLoading}
                value={
                  companyDocumentTypeOptions.find(
                    (option) => option.value === data.document_type
                  ) || null
                }
                options={companyDocumentTypeOptions}
                onChange={(currentOption) =>
                  updateForm(
                    "document_type",
                    currentOption ? currentOption.value : null
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="title">Status</Label>
              <Select
                placeholder={`Selecione o tipo de documento`}
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
