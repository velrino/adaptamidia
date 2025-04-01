/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { API } from "@/backend/api/api.endpoints";
import {
  addLogToQueue,
  getAllLogs,
  clearLogs,
} from "@/backend/queue/display_logs_create";
import { useEffect } from "react";

function useDisplayLogsQueue() {
  useEffect(() => {
    let isMounted = true;

    const processLogs = async () => {
      if (!isMounted) return;

      const logs = await getAllLogs();
      if (!logs.length) return;

      const failed: any[] = [];

      for (const log of logs) {
        try {
          await API.display_logs.create(log as any);
        } catch (err) {
          console.error("[display_logs_create] Falha ao enviar log:", err);
          failed.push(log);
        }
      }

      if (failed.length !== logs.length && isMounted) {
        await clearLogs();
        for (const fail of failed) {
          await addLogToQueue(fail);
        }
      }
    };

    const interval = setInterval(processLogs, 5000);

    processLogs();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
}

export default useDisplayLogsQueue;
