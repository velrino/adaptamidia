"use client";

import React, { useCallback, useEffect, useState } from "react";
// import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { GetErrorMessage, MissingDatesForChart } from "@/utils/generic";
import { FromEnum, IToastType } from "@/interfaces/general";
import { API } from "@/backend/api/api.endpoints";
import {
  IApiDashboardDisplayLogRecord,
  IApiDashboardDisplayLogRequest,
  IApiDashboardDisplayLogResponse,
} from "@/backend/api/api.interface";
import { IApiDashboardDisplayLogType } from "@/interfaces/display-logs";
import { DateHelper, DateHelperFormat } from "@/utils/date";
import { AdsCurrentType } from "@/interfaces/ads";
import { useTheme } from "@/context/ThemeContext";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface IChartValues {
  name: string;
  data: number[];
}

interface IDisplayLogsChart {
  title: string;
  customQuery: Partial<IApiDashboardDisplayLogRequest>;
  useFullRecords: boolean;
}

export default function DisplayLogsChart({
  title,
  customQuery,
  useFullRecords,
}: IDisplayLogsChart) {
  const { theme } = useTheme();

  const [chartOptions, setChartOptions] = useState<ApexOptions>({
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 100,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  });

  useEffect(() => {
    setChartOptions((prev) => ({
      ...prev,
      colors: ["#465fff", theme === "dark" ? "#fff" : "#000"],
    }));
  }, [theme]);
  const [chartValues, setChartValues] = useState<IChartValues[]>([]);

  const { data: session } = useSession();
  const { showToast } = useToast();
  const [response, setResponse] = useState<IApiDashboardDisplayLogResponse>();
  const [apiQueryForm] = useState<Partial<IApiDashboardDisplayLogRequest>>({
    start_at: DateHelper.subtractDays(new Date(), 1, "year").toDate(),
    end_at: DateHelper.addDays(new Date(), 1, "year").toDate(),
    ...customQuery,
  });

  useEffect(() => {
    const normalizeChartData = (records: IApiDashboardDisplayLogRecord[]) => {
      const diffDays =
        apiQueryForm.end_at && apiQueryForm.start_at
          ? Math.abs(
              DateHelper.diff(apiQueryForm.end_at, apiQueryForm.start_at) || 0
            )
          : 0;

      let list = records;

      if (useFullRecords) {
        list = MissingDatesForChart(
          records,
          diffDays > 10 ? 10 : diffDays,
          AdsCurrentType.ADVERTISEMENT,
          "day"
        ).sort((a, b) => {
          return DateHelper.dayjs(a._id.start_at).diff(
            DateHelper.dayjs(b._id.start_at)
          );
        });
      }

      const grouped = list.reduce((acc, { _id: { start_at, type }, total }) => {
        const date = DateHelper.format(start_at, DateHelperFormat.SHORT);
        acc[date] = acc[date] || {};
        acc[date][type] = (acc[date][type] || 0) + total;
        return acc;
      }, {} as Record<string, Record<string, number>>);

      const sortedDates = Object.keys(grouped);
      const types = [...new Set(records.map((r) => r._id.type))];

      return {
        categories: sortedDates,
        values: types.map((type) => ({
          name: type,
          data: sortedDates.map((date) => grouped[date][type] || 0),
        })),
      };
    };

    if (response?.records) {
      const { categories, values } = normalizeChartData(response.records);
      setChartOptions((prev) => ({
        ...prev,
        xaxis: { ...prev.xaxis, categories },
      }));
      setChartValues(values);
    }
  }, [response]);

  const getResponse = useCallback(
    async (apiQuery: Partial<IApiDashboardDisplayLogRequest>) => {
      if (!session?.api_session) {
        return;
      }

      try {
        const query: IApiDashboardDisplayLogRequest = {
          from: FromEnum.CACHE,
          page: 1,
          limit: 30,
          chart_type: IApiDashboardDisplayLogType.TOTAL_BY_TYPE,
          sort: {
            column: "_id.start_at",
            value: 1,
          },
          ...apiQueryForm,
          ...apiQuery,
          ...customQuery,
        } as IApiDashboardDisplayLogRequest;

        const response = await API.dashboard.displayLogs(
          session.api_session.access_token,
          query
        );

        const responseData = await response.json();

        if (responseData?.error) {
          showToast(GetErrorMessage(responseData.message), IToastType.ERROR);
        } else if (response.ok) {
          setResponse(responseData);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      }
    },
    [session?.api_session, showToast]
  );

  useEffect(() => {
    if (session?.api_session) {
      getResponse({
        query_group_total_by_type: {
          type: "$type",
          start_at: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$start_at",
              timezone: "America/Sao_Paulo",
            },
          },
        },
      });
    }
  }, [getResponse, session?.api_session]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>

          <span className="block text-gray-500 text-theme-sm dark:text-gray-400">
            {apiQueryForm.start_at && apiQueryForm.end_at && (
              <>
                Exibições entre{" "}
                {`${DateHelper.format(
                  apiQueryForm.start_at,
                  DateHelperFormat.SHORT
                )} e ${DateHelper.format(
                  apiQueryForm.end_at,
                  DateHelperFormat.SHORT
                )}`}
              </>
            )}
          </span>
        </div>
        {/* <ChartTab /> */}
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[1300px] xl:min-w-full pl-2">
          <ReactApexChart
            options={chartOptions}
            series={chartValues}
            type="bar"
            height={350}
          />
        </div>
      </div>
    </div>
  );
}
