import React, { memo, useCallback, useEffect, useState } from "react";
import Select from "react-select";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  IApiAdvertisementItem,
  IApiCompaniesResponse,
  IApiPaginateCompanies,
} from "@/backend/api/api.interface";
import {
  AudienceOptionsMock,
  SegmentOptionsMock,
} from "@/backend/mock/advertisements";
import { AdsAudience, AdStatusOptions } from "@/interfaces/ads";
import { IReactSelectOption, IToastType } from "@/interfaces/general";
import { IAdvertisementModalCommonProps } from "./interface";
import { FormatBrazillianDocument, GetErrorMessage } from "@/utils/generic";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { API } from "@/backend/api/api.endpoints";

const AdvertisementModalAbout = memo(
  ({ data, onUpdate }: IAdvertisementModalCommonProps) => {
    const { data: session } = useSession();
    const { showToast } = useToast();

    const updateForm = (
      column: keyof IApiAdvertisementItem,
      value: unknown
    ) => {
      onUpdate({ [column]: value });
    };

    // Start Audience
    const [audienceOptions, setAudienceOptions] = useState<
      IReactSelectOption[]
    >([]);
    const handleApiAudience = useCallback(async (): Promise<
      IReactSelectOption[]
    > => {
      return new Promise<IReactSelectOption[]>((resolve) => {
        setTimeout(() => {
          resolve(AudienceOptionsMock);
        }, 1);
      });
    }, []);

    useEffect(() => {
      handleApiAudience().then((data) => {
        setAudienceOptions(data);
      });
    }, [handleApiAudience]);
    // End Audience

    // Start Segment
    const [segmentOptions, setSegmentOptions] = useState<IReactSelectOption[]>(
      []
    );
    const handleApiSegment = useCallback(async (): Promise<
      IReactSelectOption[]
    > => {
      return new Promise<IReactSelectOption[]>((resolve) => {
        setTimeout(() => {
          resolve(SegmentOptionsMock);
        }, 1);
      });
    }, []);

    useEffect(() => {
      handleApiSegment().then((data) => {
        setSegmentOptions(data);
      });
    }, [handleApiSegment]);
    // End Segment

    // Start Companies
    // const [companySearchTerm, setCompanySearchTerm] = useState(String());
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
    // End Companies

    return (
      <div className="overflow-y-auto min-h-[75vh] max-h-[75vh] px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {data && (
            <>
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  type="text"
                  placeholder="Informe o título"
                  id="title"
                  value={data.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="title">Anunciante</Label>
                <Select
                  placeholder={`Selecione o Anunciante`}
                  isDisabled={isCompaniesLoading}
                  isLoading={isCompaniesLoading}
                  value={
                    companiesOptions.find(
                      (option) => option.value === data.company
                    ) || null
                  }
                  options={companiesOptions}
                  onChange={(currentOption) => {
                    updateForm(
                      "company",
                      currentOption ? currentOption.value : null
                    );

                    getCompanyResponse({
                      page: 1,
                    });
                  }}
                  onInputChange={(inputValue) => {
                    if (inputValue.length >= 3) {
                      getCompanyResponse({
                        name: inputValue,
                        page: 1,
                      });
                    }

                    return inputValue;
                  }}
                />
              </div>

              <div>
                <Label htmlFor="title">Segmento</Label>
                <Select
                  isMulti
                  placeholder={`Selecione os Segmentos`}
                  value={
                    segmentOptions.filter((option: IReactSelectOption) =>
                      data.segments?.includes(option.value as string)
                    ) || []
                  }
                  options={segmentOptions}
                  onChange={(newValue) => {
                    const selectedOptions = newValue.map(
                      (currentOption) => currentOption.value
                    );
                    updateForm("segments", selectedOptions);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="title">Audiência</Label>
                <Select
                  isMulti
                  placeholder={`Selecione as Audiências`}
                  value={
                    audienceOptions.filter((option: IReactSelectOption) =>
                      data.audience?.includes(option.value as AdsAudience)
                    ) || []
                  }
                  options={audienceOptions}
                  onChange={(newValue) => {
                    const selectedOptions = newValue.map(
                      (currentOption) => currentOption.value
                    );
                    updateForm("audience", selectedOptions);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="title">Status</Label>
                <Select
                  placeholder={`Selecione o status`}
                  value={
                    AdStatusOptions.find(
                      (option) => option.value === data.status
                    ) || null
                  }
                  options={AdStatusOptions}
                  onChange={(currentOption) =>
                    updateForm(
                      "status",
                      currentOption ? currentOption.value : null
                    )
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

AdvertisementModalAbout.displayName = "AdvertisementModalAbout";

export default AdvertisementModalAbout;
