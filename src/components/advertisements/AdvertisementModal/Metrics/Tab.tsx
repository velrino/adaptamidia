import {
  IApiDashboardDisplayByUnitRequest,
  IApiDashboardDisplayByUnitResponse,
} from "@/backend/api/api.interface";
import { useToast } from "@/context/ToastContext";
import { useSession } from "next-auth/react";
import DisplayLogsChart from "@/components/analytics/DisplayLogsChart";
import { GetErrorMessage } from "@/utils/generic";
import { FromEnum, IToastType } from "@/interfaces/general";
import { API } from "@/backend/api/api.endpoints";
import { IApiDashboardGeneralType } from "@/interfaces/dashboard";
import { useCallback, useEffect, useState } from "react";
import { DateHelper, DateHelperFormat } from "@/utils/date";
import TopRecordsItem from "@/components/analytics/TopRecords/TopRecordsItem";

export function AdvertisementMetricsTab({ id }: { id: string }) {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [responseDisplayByUnit, setResponseDisplayByUnit] =
    useState<IApiDashboardDisplayByUnitResponse>();
  const [loadingDisplayByUnit, setLoadingDisplayByUnit] =
    useState<boolean>(false);

  const [apiQueryForm] = useState({
    start_at: DateHelper.subtractDays(new Date(), 1, "year").toDate(),
    end_at: DateHelper.addDays(new Date(), 1, "year").toDate(),
  });
  const getResponseDisplayByUnit = useCallback(
    async (apiQuery: Partial<IApiDashboardDisplayByUnitRequest>) => {
      if (!session?.api_session) {
        return;
      }

      try {
        setLoadingDisplayByUnit(true);
        const query: IApiDashboardDisplayByUnitRequest = {
          from: FromEnum.CACHE,
          chart_type: IApiDashboardGeneralType.DISPLAY_BY_UNIT,
          page: 1,
          limit: 10,
          sort: {
            column: "total",
            value: -1,
          },
          advertisement: [id],
          ...apiQueryForm,
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
          setResponseDisplayByUnit(responseData);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
        setLoadingDisplayByUnit(false);
      }
    },
    [session?.api_session, showToast, apiQueryForm]
  );

  useEffect(() => {
    if (session?.api_session) {
      getResponseDisplayByUnit({});
    }
  }, [getResponseDisplayByUnit, session?.api_session]);

  const [subtitle, setSubtitle] = useState<string>(String());

  useEffect(() => {
    setSubtitle(
      () =>
        `${DateHelper.format(
          apiQueryForm.start_at,
          DateHelperFormat.SHORT
        )} - ${DateHelper.format(apiQueryForm.end_at, DateHelperFormat.SHORT)}`
    );
  }, [apiQueryForm]);

  return (
    <div className="overflow-y-auto min-h-[75vh] max-h-[75vh] px-6">
      <div className="grid gap-6 sm:grid-cols-4 mt-5">
        <div>
          <TopRecordsItem
            title="Estabelecimentos que mais exibiram"
            subtitle={subtitle}
            loading={loadingDisplayByUnit}
            list={{
              title: "Estabelecimento",
              valueHeader: "Exibições",
              items: (responseDisplayByUnit?.records || []).map((item) => {
                return {
                  id: item.local_unit_id,
                  label: `${item.local_unit_name}`,
                  value: String(item.total),
                };
              }),
            }}
          />
        </div>
        <div className="col-span-3">
          <DisplayLogsChart
            customQuery={{ advertisement: [id] }}
            useFullRecords={true}
          />
        </div>
      </div>
    </div>
  );
}
