import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { useLoading } from "@/context/LoadingContext";
import { useToast } from "@/context/ToastContext";
import { useSession } from "next-auth/react";
import AdvertisementMetricsChart from "./Chart";
import DisplayLogsChart from "@/components/analytics/DisplayLogsChart";

export function AdvertisementMetricsTab({ id }: { id: string }) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { showFullScreenLoading, hideFullScreenLoading } = useLoading();

  return (
    <div className="overflow-y-auto min-h-[75vh] max-h-[75vh] px-6">
      <div>
        <DisplayLogsChart customQuery={{ advertisement: [id] }} />
      </div>
    </div>
  );
}
