"use client";

import React, {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Label from "@/components/form/Label";
import {
  IApiAdvertisementItem,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { DateHelper, DateHelperFormat, DateInputStyle } from "@/utils/date";
import Flatpickr from "react-flatpickr";
import { CalenderIcon } from "@/icons";
import dynamic from "next/dynamic";
import Spinner from "@/components/ui/spinner/Spinner";
import { PiEye, PiUsersLight } from "react-icons/pi";
import {
  AdvertisementsPlans,
  AdvertisementsPlansOptions,
  FormatThousand,
  GenerateNumberRangeAsOptions,
  SumUnitPeriodNative,
} from "@/utils/generic";
import { AdPeriod, AdPeriodText } from "@/interfaces/ads";
import { AdvertisementFormProps } from "./interface";
import Select from "@/components/form/Select";
import { RegionsComponent } from "@/components/regions/Regions";
import { ContentAction } from "@/interfaces/general";

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

const AdvertisementModalLocal = memo(
  ({ data, onUpdate, action }: AdvertisementFormProps) => {
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const maxStartDate = useMemo(
      () => DateHelper.dayjs().add(2, "months").toDate(),
      []
    );
    const maxEndDate = useMemo(
      () => DateHelper.dayjs().add(2, "year").toDate(),
      []
    );

    // const tomorrow = useMemo(() => DateHelper.dayjs().toDate(), []);

    // Inicializa as datas e o plano apenas uma vez, quando o componente é montado ou quando `data` muda
    useEffect(() => {
      const start_date = DateHelper.dayjs(data.start_date);
      const end_date = DateHelper.dayjs(data.end_date);

      if (start_date.isValid() && end_date.isValid()) {
        setStartDate(start_date.toDate());
        setEndDate(end_date.toDate());
      } else {
        setStartDate(DateHelper.dayjs().add(7, "day").toDate());
        setEndDate(DateHelper.dayjs().add(14, "day").toDate());
      }

      // Inicializar o plano selecionado
      if (data.plan) {
        setSelectedPlan(data.plan as AdvertisementsPlans);
      }

      if (action === ContentAction.CREATE) {
        setSelectedPlan(AdvertisementsPlans.TWO_WEEKS);
      }

      if (action === ContentAction.UPDATE && !data?.plan) {
        setSelectedPlan(AdvertisementsPlans.CUSTOM);
      }
    }, [data, action]);

    const [formReport, setFormReport] =
      useState<IDefaultFormReport>(defaultFormReport);
    const [, setDiffBetweenDates] = useState<number>(0);
    const [metricItemMessage, setMetricItemMessage] = useState<{
      label: string;
      value: string;
    }>({
      label: "",
      value: "",
    });
    const [currentPeriod, setCurrentPeriod] = useState<AdPeriod>(
      AdPeriod.DAILY
    );
    const [currentPeriodText, setCurrentPeriodText] = useState<string>(
      AdPeriodText[currentPeriod]
    );

    const [units, setUnits] = useState<IApiUnitItemResponse[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<AdvertisementsPlans>(
      AdvertisementsPlans.CUSTOM
    );

    const classifyPeriod = useCallback((diff: number): AdPeriod => {
      if (diff <= 1) return AdPeriod.DAILY;
      if (diff < 29) return AdPeriod.WEEKLY;
      if (diff <= 30) return AdPeriod.MONTHLY;
      if (diff >= 365) return AdPeriod.YEARLY;
      return AdPeriod.MONTHLY;
    }, []);

    const calculateEndDateFromPlan = useCallback(
      (startDate: Date, plan: AdvertisementsPlans): Date => {
        const start = DateHelper.dayjs(startDate);
        switch (plan) {
          case AdvertisementsPlans.TWO_WEEKS:
            return start.add(14, "day").toDate();
          case AdvertisementsPlans.FOUR_WEEKS:
            return start.add(28, "day").toDate();
          case AdvertisementsPlans.TWELVE_WEEKS:
            return start.add(84, "day").toDate();
          case AdvertisementsPlans.TWENTY_FOUR_WEEKS:
            return start.add(168, "day").toDate();
          case AdvertisementsPlans.CUSTOM:
          default:
            return start.add(7, "day").toDate();
        }
      },
      []
    );

    useEffect(() => {
      if (startDate && endDate) {
        const diff = Math.abs(DateHelper.diff(endDate, startDate) || 0);
        setDiffBetweenDates(diff);

        const periodClassified = classifyPeriod(diff);
        const { years, months, days } = DateHelper.diffDateToObject(diff);

        const currentMessage = [
          years ? `${years} ano${years > 1 ? "s" : ""}` : "",
          months ? `${months} meses` : "",
          days ? `${days} dia${days > 1 ? "s" : ""}` : "",
        ]
          .filter(Boolean)
          .join(", ");

        setCurrentPeriod(periodClassified);
        setMetricItemMessage({
          label: periodClassified,
          value: currentMessage,
        });
      }
    }, [startDate, endDate, classifyPeriod]);

    // const [investmentText, setInvestmentText] = useState<string>("");

    useEffect(() => {
      setCurrentPeriodText(AdPeriodText[currentPeriod]);
      // const result = FormatCurrency(
      //   SumUnitPeriodNative(units, currentPeriod, "price_total")
      // );
      // setInvestmentText(result);
      updateForm(
        "units",
        units.map((unit) => unit._id)
      );
    }, [units, currentPeriod]);

    const updateFormReport = useCallback(
      (key: keyof IDefaultFormReport, message: string = "") => {
        setFormReport((prev) => ({ ...prev, [key]: message }));
      },
      []
    );

    const updateForm = useCallback(
      (column: keyof IApiAdvertisementItem, value: unknown) => {
        onUpdate({ [column]: value });
      },
      [onUpdate]
    );

    const handleStartDateChange = useCallback(
      (selectedDates: Date[]) => {
        if (selectedDates.length === 0) return;
        const newStartDate = selectedDates[0];

        setStartDate(newStartDate);
        const newEndDate = calculateEndDateFromPlan(newStartDate, selectedPlan);
        setEndDate(newEndDate);
        updateFormReport("start_date");
        updateForm("start_date", newStartDate.toISOString());
        updateForm("end_date", newEndDate.toISOString());
      },
      [selectedPlan, updateForm, updateFormReport, calculateEndDateFromPlan]
    );

    const handleEndDateChange = useCallback(
      (selectedDates: Date[]) => {
        if (selectedDates.length === 0) return;
        const currentDate = selectedDates[0];

        if (DateHelper.dayjs(currentDate).isAfter(startDate, "day")) {
          setEndDate(currentDate);
          updateFormReport("end_date");
          updateForm("end_date", currentDate.toISOString());

          // Mudar para CUSTOM quando o usuário alterar a data final manualmente
          if (selectedPlan !== AdvertisementsPlans.CUSTOM) {
            setSelectedPlan(AdvertisementsPlans.CUSTOM);
            updateForm("plan", AdvertisementsPlans.CUSTOM);
          }
        } else {
          updateFormReport(
            "end_date",
            `A data deve ser maior que ${DateHelper.format(
              startDate as Date,
              DateHelperFormat.SHORT
            )}`
          );
        }
      },
      [startDate, selectedPlan, updateForm, updateFormReport]
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
            <span className="text-sm">{label}</span>
          </div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      ),
      []
    );

    const options = GenerateNumberRangeAsOptions(5, 60);

    const handleNeighborhoodChange = useCallback((neighborhoods: string[]) => {
      updateForm("neighborhood", neighborhoods);
    }, []);

    const handleUnitsChange = useCallback(
      (newUnits: IApiUnitItemResponse[]) => {
        setUnits(newUnits);
      },
      []
    );

    return (
      <>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <LazyMap list={units} key={`map-units-${units.length}`} />
          </div>
          <div className="overflow-y-auto max-h-[75vh] pb-28 pr-6 col-span-2">
            {data && (
              <div className="grid gap-3 sm:grid-cols-2">
                {startDate && endDate && (
                  <div className="col-span-2">
                    <div className="grid gap-6 sm:grid-cols-4">
                      <div>
                        <Label>Plano</Label>
                        <Select
                          key={`plan-select-${selectedPlan}`}
                          options={AdvertisementsPlansOptions}
                          defaultValue={String(selectedPlan)}
                          placeholder="Plano"
                          onChange={(value: string) => {
                            const newPlan = value as AdvertisementsPlans;
                            setSelectedPlan(newPlan);
                            updateForm("plan", newPlan);

                            // Se não for CUSTOM, recalcular a data final baseada no plano
                            if (
                              newPlan !== AdvertisementsPlans.CUSTOM &&
                              startDate
                            ) {
                              const newEndDate = calculateEndDateFromPlan(
                                startDate,
                                newPlan
                              );
                              setEndDate(newEndDate);
                              updateForm("end_date", newEndDate.toISOString());
                            }
                          }}
                          className="dark:bg-dark-900"
                        />
                      </div>
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
                      <div>
                        <Label>Segundos</Label>
                        <Select
                          options={options}
                          defaultValue={String(data.seconds)}
                          placeholder="Segundos"
                          onChange={(value: string) => {
                            updateForm("seconds", Number(value));
                          }}
                          className="dark:bg-dark-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!formReport.start_date && !formReport.end_date && (
                  <>
                    <div className="col-span-2">
                      <div className="w-full">
                        <div className="flex flex-row w-full gap-3">
                          <MetricItem
                            label={`Período (${currentPeriodText})`}
                            value={metricItemMessage.value}
                            icon={<PiUsersLight size={15} />}
                          />
                          <MetricItem
                            label={`Alcance (${currentPeriodText})`}
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
                            label={`Exibições (${currentPeriodText})`}
                            value={FormatThousand(
                              SumUnitPeriodNative(
                                units,
                                AdPeriod.MONTHLY,
                                "display_times"
                              )
                            )}
                            icon={<PiEye size={15} />}
                          />
                          {/* <MetricItem
                            label={`Investimento (${currentPeriodText})`}
                            value={investmentText}
                            icon={<BsCashCoin size={15} />}
                          /> */}
                        </div>
                      </div>
                    </div>

                    <RegionsComponent
                      neighborhoodInformed={data.neighborhood}
                      unitsInformed={data.units || []}
                      onNeighborhoodChange={handleNeighborhoodChange}
                      onUnitsChange={handleUnitsChange}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
);

AdvertisementModalLocal.displayName = "AdvertisementModalLocal";

export default AdvertisementModalLocal;
