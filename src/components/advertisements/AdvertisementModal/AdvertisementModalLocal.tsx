"use client";

import React, {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Label from "@/components/form/Label";
import {
  IApiAdvertisementItem,
  IApiGroupCompanyUnitsRequest,
  IApiGroupCompanyUnitsResponseItem,
  IApiPaginateCompanyUnits,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { DateHelper, DateHelperFormat, DateInputStyle } from "@/utils/date";
import Flatpickr from "react-flatpickr";
import { CalenderIcon } from "@/icons";
// import { CompanyUnitsMock, CompanyUnitsMockData } from "@/backend/mock/units";
import dynamic from "next/dynamic";
import SelectReact from "react-select";
import AdvertisementModalUnits from "./AdvertisementModalUnits";
import { IReactSelectOption, IToastType } from "@/interfaces/general";
import { SumAllDevices } from "./helper";
import {
  EnumAdvertisementModalUnit,
  IAdvertisementModalUnitCallback,
} from "./AdvertisementModalUnits/interface";
import Spinner from "@/components/ui/spinner/Spinner";
import { PiEye, PiUsersLight } from "react-icons/pi";
import {
  // FormatCurrency,
  FormatThousand,
  GenerateNumberRangeAsOptions,
  GetErrorMessage,
  SumUnitPeriodNative,
} from "@/utils/generic";
import { AdPeriod, AdPeriodText } from "@/interfaces/ads";
// import { BsCashCoin } from "react-icons/bs";
import { IAdvertisementModalCommonProps } from "./interface";
import Select from "@/components/form/Select";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { API } from "@/backend/api/api.endpoints";
import { useLoading } from "@/context/LoadingContext";

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

interface IAdvertisementModalLocal extends IAdvertisementModalCommonProps {
  default_units: IApiUnitItemResponse[];
}

const AdvertisementModalLocal = memo(
  ({ data, onUpdate, default_units }: IAdvertisementModalLocal) => {
    const { data: session } = useSession();
    const { showFullScreenLoading, hideFullScreenLoading } = useLoading();
    const { showToast } = useToast();

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

    const tomorrow = useMemo(
      () => DateHelper.dayjs().add(1, "day").toDate(),
      []
    );

    // Inicializa as datas apenas uma vez, quando o componente é montado ou quando `data` muda
    useEffect(() => {
      const start_date = DateHelper.dayjs(data.start_date);
      const end_date = DateHelper.dayjs(data.end_date);

      if (start_date.isValid() && end_date.isValid()) {
        setStartDate(start_date.toDate());
        setEndDate(end_date.toDate());
      } else {
        setStartDate(DateHelper.dayjs(tomorrow).add(7, "day").toDate());
        setEndDate(DateHelper.dayjs(tomorrow).add(14, "day").toDate());
      }

      console.log({ AdvertisementModalLocal: data.units });
    }, [data, tomorrow]);

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

    const [showUnits, setShowUnits] = useState<boolean>(true);

    const handleToggleShowUnits = useCallback(() => {
      setShowUnits((prev) => !prev);
    }, []);

    const [units, setUnits] = useState<IApiUnitItemResponse[]>(
      default_units || []
    );

    const getUnits = useCallback(
      async (apiQuery: IApiPaginateCompanyUnits) => {
        if (!session?.api_session) {
          return;
        }

        setIsUnitsLoading(true);
        showFullScreenLoading();
        try {
          const query: IApiPaginateCompanyUnits = {
            // page: currentPage,
            limit: 100,
            ...apiQuery,
          };

          const response = await API.company_units.paginate(
            session.api_session.access_token,
            query
          );

          const responseData = await response.json();

          if (responseData?.error) {
            showToast(GetErrorMessage(responseData.error), IToastType.ERROR);
          } else if (response.ok) {
            setUnits((prevUnits) => {
              const existingIds = new Set(
                prevUnits.map((unit: IApiUnitItemResponse) => unit._id)
              );
              const newUnits = responseData.data.filter(
                (unit: IApiUnitItemResponse) => !existingIds.has(unit._id)
              );
              return [...prevUnits, ...newUnits]; // Adiciona apenas os novos
            });
            showToast("Adicionado com sucesso", IToastType.SUCCESS);
          }
        } catch (error) {
          showToast(GetErrorMessage(error), IToastType.ERROR);
        } finally {
          setIsUnitsLoading(false);
          hideFullScreenLoading();
        }
      },
      [
        session?.api_session,
        showToast,
        showFullScreenLoading,
        hideFullScreenLoading,
      ]
    );

    const lastNeighborhoods = useRef<string[]>(data.neighborhood || []);

    useEffect(() => {
      const currentNeighborhoods = data.neighborhood || [];
      const currentLength = currentNeighborhoods.length;

      // Detecta adição de bairro
      if (currentLength > lastNeighborhoods.current.length) {
        const lastNeighborhood = currentNeighborhoods.slice(-1)[0];
        getUnits({ neighborhood: lastNeighborhood });
      }
      // Detecta remoção de bairro
      else if (currentLength < lastNeighborhoods.current.length) {
        const removedNeighborhood = lastNeighborhoods.current.find(
          (neighborhood) => !currentNeighborhoods.includes(neighborhood)
        );

        if (removedNeighborhood) {
          setUnits((prevUnits) =>
            prevUnits.filter(
              (unit) => unit.neighborhood !== removedNeighborhood
            )
          );
        }
      }

      // Atualiza a referência para o próximo render
      lastNeighborhoods.current = currentNeighborhoods;
    }, [data.neighborhood, getUnits]);

    const classifyPeriod = useCallback((diff: number): AdPeriod => {
      if (diff <= 1) return AdPeriod.DAILY;
      if (diff < 29) return AdPeriod.WEEKLY;
      if (diff <= 30) return AdPeriod.MONTHLY;
      if (diff >= 365) return AdPeriod.YEARLY;
      return AdPeriod.MONTHLY;
    }, []);

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

    const [unitsOptions, setUnitsOptions] = useState<IReactSelectOption[]>([]);
    const [isUnitsLoading, setIsUnitsLoading] = useState(false);

    const getCompanyGroup = useCallback(
      async (apiQuery: IApiGroupCompanyUnitsRequest) => {
        if (!session?.api_session) {
          return;
        }

        setIsUnitsLoading(true);
        try {
          const query: IApiGroupCompanyUnitsRequest = {
            // page: currentPage,
            // limit: 100,
            // popular_time: true,
            ...apiQuery,
          };

          const response = await API.company_units.group(
            session.api_session.access_token,
            query
          );

          const responseData = await response.json();

          if (responseData?.error) {
            showToast(GetErrorMessage(responseData.error), IToastType.ERROR);
          } else if (response.ok) {
            const companyUnitList = responseData.data
              .map((item: IApiGroupCompanyUnitsResponseItem) => ({
                value: item.neighborhood,
                label: `${item.city} - ${item.neighborhood}`,
              }))
              .sort((a: IReactSelectOption, b: IReactSelectOption) =>
                a.label.localeCompare(b.label)
              );
            setUnitsOptions(companyUnitList);
          }
        } catch (error) {
          showToast(GetErrorMessage(error), IToastType.ERROR);
        } finally {
          setIsUnitsLoading(false);
        }
      },
      [session?.api_session, showToast]
    );

    useEffect(() => {
      if (session?.api_session) {
        getCompanyGroup({});
      }
    }, [getCompanyGroup, session?.api_session]);

    const advertisementModalUnitsCallback = useCallback(
      (current: IAdvertisementModalUnitCallback) => {
        if (current.type === EnumAdvertisementModalUnit.REMOVE_UNIT) {
          const currentData = current.data as IApiUnitItemResponse;
          const newUnits = units.filter((item) => item._id !== currentData._id);
          setUnits(newUnits);
        }
      },
      [units]
    );

    const handleStartDateChange = useCallback(
      (selectedDates: Date[]) => {
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
            )} e menor que ${DateHelper.format(
              endDate as Date,
              DateHelperFormat.SHORT
            )}.`
          );
        }
      },
      [endDate, tomorrow, updateForm, updateFormReport]
    );

    const handleEndDateChange = useCallback(
      (selectedDates: Date[]) => {
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
      },
      [startDate, updateForm, updateFormReport]
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

    const options = GenerateNumberRangeAsOptions(20, 40);

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
                    <div className="grid gap-6 sm:grid-cols-3">
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

                    <div className="col-span-2">
                      <Label htmlFor="title">
                        Regiões {data.neighborhood.length}
                      </Label>
                      <SelectReact
                        isMulti
                        placeholder="Selecione as regiões"
                        isDisabled={isUnitsLoading}
                        isLoading={isUnitsLoading}
                        className="dark:bg-dark-900"
                        value={
                          unitsOptions.filter((option: IReactSelectOption) =>
                            data.neighborhood.includes(option.value as string)
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
                        title={`Estabelecimentos (${
                          units.length
                        }) - ${SumAllDevices(units)} Telas`}
                        content={units}
                        seconds={data.seconds}
                        isOpen={showUnits}
                        toggleAccordion={handleToggleShowUnits}
                        callback={advertisementModalUnitsCallback}
                      />
                    </div>
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
