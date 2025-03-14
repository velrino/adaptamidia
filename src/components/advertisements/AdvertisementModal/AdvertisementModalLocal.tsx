"use client";

import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Label from "@/components/form/Label";
import { AdvertisementModalCommonProps } from "./interface";
import {
  IApiAdvertisementItem,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { useDynamicForm } from "@/utils/form";
import { DateHelper, DateHelperFormat, DateInputStyle } from "@/utils/date";
import Flatpickr from "react-flatpickr";
import { CalenderIcon } from "@/icons";
import {
  CompanyUnitsGroupdMock,
  CompanyUnitsMock,
  CompanyUnitsMockData,
} from "@/backend/mock/units";
import dynamic from "next/dynamic";
import Select from "react-select";
import AdvertisementModalUnits from "./AdvertisementModalUnits";
import { IReactSelectOption } from "@/interfaces/general";
import { SumAllDevices } from "./helper";
import {
  EnumAdvertisementModalUnit,
  IAdvertisementModalUnitCallback,
} from "./AdvertisementModalUnits/interface";
import Spinner from "@/components/ui/spinner/Spinner";
import { PiUsersLight } from "react-icons/pi";
import {
  FormatCurrency,
  FormatThousand,
  SumUnitPeriodNative,
} from "@/utils/generic";
import { AdPeriod } from "@/interfaces/ads";

const LazyMap = dynamic(() => import("./Ads/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <Spinner color="#465fff" />
    </div>
  ),
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
  const maxStartDate = DateHelper.dayjs().add(2, "months").toDate();
  const maxEndDate = DateHelper.dayjs().add(1, "year").toDate();

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

  const [unitsOptions, setUnitsOptions] = useState<IReactSelectOption[]>([]);
  const [isUnitsLoading, setIsUnitsLoading] = useState(false);

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
    fetchUnitsOptions(); // Fetch units options on mount
  }, [fetchUnitsOptions]);

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
      updateForm("start_date", newStartDate.toISOString());
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
      updateForm("end_date", currentDate.toISOString());
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

  function MetricItem({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string;
    icon: ReactNode;
  }) {
    return (
      <div className="flex flex-col flex-1 min-w-0 items-start text-gray-600 dark:text-gray-300 border-l first:border-l-0 pl-3 first:pl-0">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <div className="text-lg font-bold">{value}</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="">
          <LazyMap
            list={units}
            key={`map-units-${
              CompanyUnitsMock.data.length
            }-${new Date().toISOString()}`}
          />
        </div>
        <div className="overflow-y-auto max-h-[75vh] pb-28 pr-6 col-span-2">
          {formData && (
            <div className="grid gap-6 sm:grid-cols-2">
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
                <div className="w-full ">
                  <div className="flex flex-row w-full gap-3">
                    <MetricItem
                      label="Alcance"
                      value={FormatThousand(
                        SumUnitPeriodNative(
                          units,
                          AdPeriod.MONTHLY,
                          "price_total"
                        )
                      )}
                      icon={<PiUsersLight size={15} />}
                    />
                    <MetricItem
                      label="Exibições"
                      value={FormatThousand(
                        SumUnitPeriodNative(
                          units,
                          AdPeriod.MONTHLY,
                          "display_times"
                        )
                      )}
                      icon={<PiUsersLight size={15} />}
                    />
                    <MetricItem
                      label="Investimento"
                      value={FormatCurrency(
                        SumUnitPeriodNative(
                          units,
                          AdPeriod.MONTHLY,
                          "price_total"
                        )
                      )}
                      icon={<PiUsersLight size={15} />}
                    />
                  </div>
                </div>
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
