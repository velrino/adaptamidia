"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { AdvertisementModalCommonProps } from "./interface";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { useDynamicForm } from "@/utils/form";
import { DateHelper, DateHelperFormat, DateInputStyle } from "@/utils/date";
import { CalenderIcon } from "@/icons";
import Flatpickr from "react-flatpickr";
import MultiSelect, { Option } from "@/components/form/MultiSelect";
import { AudienceOptionsMock } from "@/backend/mock/advertisements";
import { AdsAudience } from "@/interfaces/ads";
// import { AdvertisementMap } from "./Ads/Map";
import { CompanyUnitsMock } from "@/backend/mock/units";
import dynamic from "next/dynamic";

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

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="overflow-y-auto max-h-[75vh] pb-28">
          {formData && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
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

              <div className="col-span-2">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 p-4">
                  {CompanyUnitsMock.data.map((unit) => (
                    <div
                      key={unit._id}
                      className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {unit.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        📍 {unit.address}
                      </p>

                      <div className="mt-3 flex flex-col gap-1 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Tipo: <span className="font-medium">{unit.type}</span>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Capacidade Máx.:{" "}
                          <span className="font-medium">
                            {unit.max_capacity}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 flex justify-between items-center">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                            unit.status === "IN_REVIEW"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-green-200 text-green-800"
                          }`}
                        >
                          {unit.status.replace("_", " ")}
                        </span>

                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          🏢 Empresa ID: {unit.company}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* <div>{faker.number.int({ min: 2000, max: 30000 })}</div> */}
            </div>
          )}
        </div>
        <div className="sticky h-screen">
          <LazyMap
            list={CompanyUnitsMock.data}
            key={`map-units-${
              CompanyUnitsMock.data.length
            }-${new Date().toISOString()}`}
          />
        </div>
      </div>
    </>
  );
}
