"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Label from "@/components/form/Label";
import { AdvertisementModalCommonProps } from "./interface";
import {
  IApiAdvertisementItem,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { useDynamicForm } from "@/utils/form";
import { DateHelper } from "@/utils/date";

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

export default function AdvertisementModalLocal(
  params: AdvertisementModalCommonProps
) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      console.log({ currentData });
      const newUnits = units.filter((item) => item._id !== currentData._id);
      // const newNeighborhoods = [
      //   ...new Set(newUnits.map((item) => item.neighborhood)),
      // ];

      // updateForm("neighborhood", newNeighborhoods);
      setUnits(() => newUnits);
    }
  };

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sticky h-screen">
          <LazyMap
            list={units}
            key={`map-units-${
              CompanyUnitsMock.data.length
            }-${new Date().toISOString()}`}
          />
        </div>
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

              {/* <div>{faker.number.int({ min: 2000, max: 30000 })}</div> */}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
