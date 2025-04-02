"use client";

import { useEffect, useRef } from "react";
import { API } from "@/backend/api/api.endpoints";
import {
  addLogToQueue,
  getAllLogs,
  clearLogs,
} from "@/backend/queue/display_logs_create";
import { IApiCreateDisplayLogRequest } from "@/backend/api/api.interface";

function useDisplayLogsQueue() {
  const isProcessing = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;

      try {
        const logs: IApiCreateDisplayLogRequest[] = await getAllLogs();
        if (!logs.length) return;

        const failed: IApiCreateDisplayLogRequest[] = [];

        for (const log of logs) {
          try {
            await API.display_logs.create(log);
          } catch (err) {
            console.error("[display_logs_create] Falha ao enviar log:", err);
            failed.push(log);
          }
        }

        if (failed.length !== logs.length) {
          await clearLogs();
          for (const fail of failed) {
            await addLogToQueue(fail);
          }
        }
      } finally {
        isProcessing.current = false;
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return null;
}

export default useDisplayLogsQueue;
