"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { AdvertisementModalCommonProps } from "./interface";
import {
  IApiAdvertisementItem,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { useDynamicForm } from "@/utils/form";
import { DateHelper, DateHelperFormat, DateInputStyle } from "@/utils/date";
import { CalenderIcon } from "@/icons";
import Flatpickr from "react-flatpickr";
import MultiSelect, { Option } from "@/components/form/MultiSelect";
import { AudienceOptionsMock } from "@/backend/mock/advertisements";
import { AdsAudience } from "@/interfaces/ads";
// import { AdvertisementMap } from "./Ads/Map";
import {
  CompanyUnitsGroupdMock,
  CompanyUnitsMock,
  CompanyUnitsMockData,
} from "@/backend/mock/units";
import dynamic from "next/dynamic";
import Select from "react-select";
import { CompanyMockData } from "@/backend/mock/client";
import { EnumApiCompanyType } from "@/backend/api/api.enum";
import AdvertisementModalUnits from "./AdvertisementModalUnits";
import { IReactSelectOption } from "@/interfaces/general";
import { SumAllDevices } from "./helper";
import {
  EnumAdvertisementModalUnit,
  IAdvertisementModalUnitCallback,
} from "./AdvertisementModalUnits/interface";

const LazyMap = dynamic(() => import("./Ads/Map"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

interface IDefaultFormReport {
  start_date: string;
  end_date: string;
}

const defaultFormReport: IDefaultFormReport = {
  start_date: String(),
  end_date: String(),
};

export default function AdvertisementModalAbout(
  params: AdvertisementModalCommonProps
) {
  const maxStartDate = DateHelper.dayjs().add(2, "months").toDate();
  const maxEndDate = DateHelper.dayjs().add(1, "year").toDate();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [audienceOptions, setAudienceOptions] = useState<Option[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [audienceSelected, setAudienceSelected] = useState<AdsAudience[]>([]);
  const [formReport, setFormReport] = useState<IDefaultFormReport>({
    ...defaultFormReport,
  });

  const [showUnits, setShowUnits] = useState<boolean>(true); // Initially open the first accordion

  const handleToggleShowUnits = () => {
    setShowUnits((prev) => !prev);
  };

  const tomorrow = useMemo(() => DateHelper.dayjs().add(1, "day").toDate(), []);
  const initialFormData = useMemo(() => {
    const start_date = DateHelper.dayjs(params.data.start_date);
    setStartDate(() =>
      start_date.isValid()
        ? start_date.toDate()
        : DateHelper.dayjs(tomorrow).add(7, "day").toDate()
    );

    const end_date = DateHelper.dayjs(params.data.end_date);
    setEndDate(() =>
      end_date.isValid()
        ? end_date.toDate()
        : DateHelper.dayjs(tomorrow).add(7, "day").toDate()
    );

    return params.data;
  }, [params.data, tomorrow]);

  const { formData, handleChange } =
    useDynamicForm<IApiAdvertisementItem>(initialFormData);

  useEffect(() => {
    if (params.onCallback && formData) {
      params.onCallback(formData);
    }
  }, [params, formData]);

  const [units, setUnits] = useState<IApiUnitItemResponse[]>([]);
  const filterUnitsByNeighborhood = () => {
    const currentUnits = CompanyUnitsMockData.filter((unit) =>
      formData.neighborhood?.includes(unit.neighborhood)
    );

    setUnits(() => currentUnits);
  };

  useEffect(() => {
    const neighborhoods = CompanyUnitsGroupdMock.data.map(
      (item) => item.neighborhood
    );
    updateForm("neighborhood", neighborhoods);
  }, []);

  useEffect(() => {
    filterUnitsByNeighborhood();
  }, [formData.neighborhood]);

  useEffect(() => {
    console.log({ example: startDate });
  }, [startDate]);

  const updateFormReport = (
    key: keyof IDefaultFormReport,
    message: string = ""
  ) => {
    setFormReport((prev) => ({
      ...prev,
      [key]: message,
    }));
  };

  const handleStartDateChange = (selectedDates: Date[]) => {
    if (selectedDates.length === 0) return;

    const newStartDate = selectedDates[0];

    if (
      DateHelper.dayjs(newStartDate).isSameOrAfter(tomorrow, "day") &&
      DateHelper.dayjs(newStartDate).isBefore(endDate, "day")
    ) {
      setStartDate(newStartDate);
      setEndDate(DateHelper.dayjs(newStartDate).add(7, "day").toDate());
      updateFormReport("start_date");
      handleChange("start_date", newStartDate.toISOString());
    } else {
      updateFormReport(
        "start_date",
        `A data deve ser maior ou igual a ${DateHelper.format(
          tomorrow,
          DateHelperFormat.SHORT
        )} 
        e menor que ${DateHelper.format(
          endDate as Date,
          DateHelperFormat.SHORT
        )}.`
      );
    }
  };

  const handleEndDateChange = (selectedDates: Date[]) => {
    if (selectedDates.length === 0) return;

    const currentDate = selectedDates[0];

    if (DateHelper.dayjs(currentDate).isAfter(startDate, "day")) {
      setEndDate(currentDate);
      updateFormReport("end_date");
      handleChange("end_date", currentDate.toISOString());
    } else {
      updateFormReport(
        "end_date",
        `A data deve ser maior que ${DateHelper.format(
          startDate as Date,
          DateHelperFormat.SHORT
        )}`
      );
    }
  };

  const handleApiAudience = useCallback(async (): Promise<Option[]> => {
    return new Promise<Option[]>((resolve) => {
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

  const updateForm = (column: keyof IApiAdvertisementItem, value: unknown) => {
    handleChange(column, value);
  };

  const [advertiserOptions, setAdvertiserOptions] = useState<
    IReactSelectOption[]
  >([]);
  const [unitsOptions, setUnitsOptions] = useState<IReactSelectOption[]>([]);
  const [isAdvertiserLoading, setIsAdvertiserLoading] = useState(false);
  const [isUnitsLoading, setIsUnitsLoading] = useState(false);

  // Fetch and set advertiser options
  const fetchAdvertiserOptions = useCallback(async () => {
    setIsAdvertiserLoading(true); // Start loading
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate 500ms delay
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
      setIsAdvertiserLoading(false); // End loading
    }
  }, []);

  // Fetch and set units options
  const fetchUnitsOptions = useCallback(async () => {
    setIsUnitsLoading(true); // Start loading
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate 500ms delay
      const companyUnitList = CompanyUnitsGroupdMock.data
        .map((item) => ({
          value: item.neighborhood,
          label: `${item.city} - ${item.neighborhood}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setUnitsOptions(companyUnitList);
    } catch (error) {
      console.error("Error fetching units options:", error);
    } finally {
      setIsUnitsLoading(false); // End loading
    }
  }, []);

  useEffect(() => {
    fetchAdvertiserOptions(); // Fetch advertiser options on mount
    fetchUnitsOptions(); // Fetch units options on mount
  }, [fetchAdvertiserOptions, fetchUnitsOptions]);

  const advertisementModalUnitsCallback = (
    current: IAdvertisementModalUnitCallback
  ) => {
    if (current.type === EnumAdvertisementModalUnit.REMOVE_UNIT) {
      const currentData: IApiUnitItemResponse =
        current.data as IApiUnitItemResponse;

      const newUnits = units.filter((item) => item._id !== currentData._id);
      const newNeighborhoods = [
        ...new Set(newUnits.map((item) => item.neighborhood)),
      ];

      setUnits(() => newUnits);
      updateForm("neighborhood", newNeighborhoods);
    }
  };

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="overflow-y-auto max-h-[75vh] pb-28">
          {formData && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="col-span-2">
                <Label htmlFor="title">Anunciante</Label>
                <Select
                  placeholder={`Selecione o Anunciante`}
                  isDisabled={isAdvertiserLoading}
                  isLoading={isAdvertiserLoading}
                  value={
                    advertiserOptions.find(
                      (option) => option.value === formData.company
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
              <div className="col-span-2">
                <Label htmlFor="title">Regiões</Label>
                <Select
                  isMulti
                  placeholder={`Selecione as regiões`}
                  isDisabled={isUnitsLoading}
                  isLoading={isUnitsLoading}
                  value={
                    unitsOptions.filter((option) =>
                      formData.neighborhood?.includes(option.value)
                    ) || []
                  }
                  options={unitsOptions}
                  onChange={(newValue) => {
                    const neighborhoods = newValue.map(
                      (neighborhood) => neighborhood.value
                    );
                    updateForm("neighborhood", neighborhoods);
                  }}
                />
              </div>
              <div className="col-span-2">
                <AdvertisementModalUnits
                  title={`Estabelecimentos (${units.length}) - ${SumAllDevices(
                    units
                  )} Telas`}
                  content={units}
                  isOpen={showUnits}
                  toggleAccordion={handleToggleShowUnits}
                  callback={advertisementModalUnitsCallback}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  type="text"
                  placeholder="Informe o título"
                  id="title"
                  value={formData?.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  maxLength={100}
                />
              </div>

              {startDate && endDate && (
                <div className="col-span-2">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Start Date Picker */}
                    <div>
                      <Label htmlFor="startDate">Data inicial</Label>
                      <div className="relative w-full flatpickr-wrapper">
                        <Flatpickr
                          options={{
                            dateFormat: "d/m/Y",
                            maxDate: maxStartDate,
                          }}
                          className={DateInputStyle.tradicional}
                          defaultValue={startDate.toString()}
                          value={startDate}
                          onChange={handleStartDateChange}
                        />
                        <span className={DateInputStyle.calendar}>
                          <CalenderIcon />
                        </span>
                      </div>
                      <div className="text-sm text-red-500">
                        {formReport.start_date}
                      </div>
                    </div>

                    {/* End Date Picker */}
                    <div>
                      <Label htmlFor="endDate">Data final</Label>
                      <div className="relative w-full flatpickr-wrapper">
                        <Flatpickr
                          options={{
                            dateFormat: "d/m/Y",
                            maxDate: maxEndDate,
                          }}
                          className={DateInputStyle.tradicional}
                          defaultValue={endDate.toString()}
                          value={endDate}
                          onChange={handleEndDateChange}
                        />
                        <span className={DateInputStyle.calendar}>
                          <CalenderIcon />
                        </span>
                      </div>
                      <div className="text-sm text-red-500">
                        {formReport.end_date}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="col-span-2">
                <MultiSelect
                  label="Audiências"
                  options={audienceOptions}
                  defaultSelected={formData.audience}
                  onChange={(values) => {
                    setAudienceSelected(values as AdsAudience[]);
                    handleChange("audience", values);
                  }}
                />
                <p className="sr-only">
                  Selected Values: {audienceOptions.join(", ")}
                </p>
              </div>

              {/* <div>{faker.number.int({ min: 2000, max: 30000 })}</div> */}
            </div>
          )}
        </div>
        <div className="sticky h-screen">
          <LazyMap
            list={units}
            key={`map-units-${
              CompanyUnitsMock.data.length
            }-${new Date().toISOString()}`}
          />
        </div>
      </div>
    </>
  );
}
