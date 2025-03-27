import React, { memo, useCallback, useEffect, useState } from "react";
import Select from "react-select";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import {
  AudienceOptionsMock,
  SegmentOptionsMock,
} from "@/backend/mock/advertisements";
import { AdsAudience, AdStatusOptions } from "@/interfaces/ads";
import { IReactSelectOption } from "@/interfaces/general";
import { IAdvertisementModalCommonProps } from "./interface";
import { CompanySelect } from "@/reusable/CompanySelect/CompanySelect";
import { EnumApiCompanyType } from "@/backend/api/api.enum";

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
                <CompanySelect
                  value={data?.company?._id}
                  queryBuilder={{
                    type: EnumApiCompanyType.ADVERTISER,
                    limit: 25,
                  }}
                  onChange={(companyId) => {
                    updateForm("company", { ...data.company, _id: companyId });
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
