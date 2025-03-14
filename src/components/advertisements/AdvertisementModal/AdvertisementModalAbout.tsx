import React, { memo, useCallback, useEffect, useState } from "react";
import Select from "react-select";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { SegmentOptionsMock } from "@/backend/mock/advertisements";
import { AdsAudience } from "@/interfaces/ads";
import { IReactSelectOption } from "@/interfaces/general";
import { CompanyMockData } from "@/backend/mock/client";
import { EnumApiCompanyType } from "@/backend/api/api.enum";
import { IAdvertisementModalCommonProps } from "./interface";

const AdvertisementModalAbout = memo(
  ({ data, onUpdate }: IAdvertisementModalCommonProps) => {
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
          resolve(SegmentOptionsMock);
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

    // Start Advertiser
    const [advertiserOptions, setAdvertiserOptions] = useState<
      IReactSelectOption[]
    >([]);
    const [isAdvertiserLoading, setIsAdvertiserLoading] = useState(false);

    const fetchAdvertiserOptions = useCallback(async () => {
      setIsAdvertiserLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const companyList = CompanyMockData.filter(
          (item) => item.type === EnumApiCompanyType.ADVERTISER
        ).map((item) => ({
          value: item._id,
          label: `${item.name} (${item.document})`,
        }));
        setAdvertiserOptions(companyList);
      } catch (error) {
        console.error("Error fetching advertiser options:", error);
      } finally {
        setIsAdvertiserLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchAdvertiserOptions();
    }, [fetchAdvertiserOptions]);
    // End Advertiser

    return (
      <div className="overflow-y-auto min-h-[75vh] max-h-[75vh] px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {data && (
            <>
              <div>
                <Label htmlFor="title">Título {data.end_date}</Label>
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
                  isDisabled={isAdvertiserLoading}
                  isLoading={isAdvertiserLoading}
                  value={
                    advertiserOptions.find(
                      (option) => option.value === data.company
                    ) || null
                  }
                  options={advertiserOptions}
                  onChange={(currentOption) =>
                    updateForm(
                      "company",
                      currentOption ? currentOption.value : null
                    )
                  }
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
            </>
          )}
        </div>
      </div>
    );
  }
);

AdvertisementModalAbout.displayName = "AdvertisementModalAbout";

export default AdvertisementModalAbout;
