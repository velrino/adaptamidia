"use client";

import React, { useCallback, useEffect, useState } from "react";
// import Badge from "../ui/badge/Badge";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import {
  IApiDashboardResumeRequest,
  IApiDashboardResumeResponse,
} from "@/backend/api/api.interface";
import { FromEnum, IToastType } from "@/interfaces/general";
import { IApiDashboardGeneralType } from "@/interfaces/dashboard";
import { DateHelper } from "@/utils/date";
import { API } from "@/backend/api/api.endpoints";
import { GetErrorMessage } from "@/utils/generic";

interface IChartItem {
  id: number;
  title: string;
  value: string;
  change: string;
  direction: string;
  comparisonText: string;
}

const AnalyticsMetrics: React.FC = () => {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [response, setResponse] = useState<IApiDashboardResumeResponse>();

  const [chartValues, setChartValues] = useState<IChartItem[]>([]);
  useEffect(() => {
    setChartValues([
      {
        id: 1,
        title: "Anúncios exibidos",
        value: String(response?.display.advertisement || 0),
        change: "+20%",
        direction: "up",
        comparisonText: "Vs last month",
      },
      {
        id: 2,
        title: "Anúncios criados",
        value: String(response?.advertisement.total || 0),
        change: "+1.59%",
        direction: "up",
        comparisonText: "Vs last month",
      },
      {
        id: 3,
        title: "Notícias publicadas",
        value: String(response?.news.total || 0),
        change: "+4%",
        direction: "up",
        comparisonText: "Vs last month",
      },
      {
        id: 4,
        title: "Notícias exibidas",
        value: String(response?.display.news || 0),
        change: "+7%",
        direction: "up",
        comparisonText: "Vs last month",
      },
    ]);
  }, [response]);

  const getResponse = useCallback(
    async (apiQuery: Partial<IApiDashboardResumeRequest>) => {
      if (!session?.api_session) {
        return;
      }

      try {
        const query: IApiDashboardResumeRequest = {
          from: FromEnum.CACHE,
          chart_type: IApiDashboardGeneralType.RESUME,
          start_at: DateHelper.subtractDays(new Date(), 1, "year").toDate(),
          end_at: DateHelper.addDays(new Date(), 1, "year").toDate(),
          ...apiQuery,
        };

        const response = await API.dashboard.generalResume(
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
      getResponse({});
    }
  }, [getResponse, session?.api_session]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {/* <!-- Metric Item Start --> */}
      {chartValues.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <p className="text-gray-500 text-theme-sm dark:text-gray-400">
            {item.title}
          </p>
          <div className="flex items-end justify-between mt-3">
            <div>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {item.value}
              </h4>
            </div>
            {/* <div className="flex items-center gap-1">
              <Badge
                color={
                  item.direction === "up"
                    ? "success"
                    : item.direction === "down"
                    ? "error"
                    : "warning"
                }
              >
                <span className="text-xs"> {item.change}</span>
              </Badge>
              <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                {item.comparisonText}
              </span>
            </div> */}
          </div>
        </div>
      ))}

      {/* <!-- Metric Item End --> */}
    </div>
  );
};

export default AnalyticsMetrics;
