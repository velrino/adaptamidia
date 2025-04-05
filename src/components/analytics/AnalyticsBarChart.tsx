"use client";

import React, { useCallback, useEffect, useState } from "react";
// import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";

import dynamic from "next/dynamic";
import { faker } from "@faker-js/faker";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { GetErrorMessage } from "@/utils/generic";
import { FromEnum, IToastType } from "@/interfaces/general";
import { API } from "@/backend/api/api.endpoints";
import {
  IApiDashboardDisplayLogRequest,
  IApiDashboardDisplayLogResponse,
} from "@/backend/api/api.interface";
import { IApiDashboardDisplayLogType } from "@/interfaces/display-logs";
import { DateHelper } from "@/utils/date";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface IChartValues {
  name: string;
  data: number[];
}

export default function AnalyticsBarChart() {
  const [chartOptions, setChartOptions] = useState<ApexOptions>({
    colors: ["#465fff", "#fff"],
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
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  });
  const [chartValues, setChartValues] = useState<IChartValues[]>([]);

  const { data: session } = useSession();
  const { showToast } = useToast();
  const [response, setResponse] = useState<IApiDashboardDisplayLogResponse>();

  useEffect(() => {
    const list = response?.records || [];
    const currentCategories: string[] = [];
    const typeMap: Record<string, number[]> = {};

    for (const item of list) {
      currentCategories.push(item._id.start_at);

      const type = item._id.type;
      const total = item.total;

      if (!typeMap[type]) {
        typeMap[type] = [];
      }
      typeMap[type].push(total);
    }

    const currentValues = Object.entries(typeMap).map(([name, data]) => ({
      name,
      data,
    }));

    setChartOptions((prev) => ({
      ...prev,
      xaxis: { ...prev.xaxis, categories: currentCategories },
    }));
    setChartValues(() => currentValues);
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
            value: -1,
          },
          start_at: DateHelper.subtractDays(new Date(), 1, "year").toDate(),
          end_at: DateHelper.addDays(new Date(), 1, "year").toDate(),
          ...apiQuery,
        };

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
            Analytics
          </h3>
          <span className="block text-gray-500 text-theme-sm dark:text-gray-400">
            Exibições nos últimos dias
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
