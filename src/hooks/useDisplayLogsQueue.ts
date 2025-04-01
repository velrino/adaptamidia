"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { API } from "@/backend/api/api.endpoints";
import {
  addLogToQueue,
  getAllLogs,
  clearLogs,
} from "@/backend/queue/display_logs_create";
import { useEffect } from "react";

function useDisplayLogsQueue() {
  useEffect(() => {
    const interval = setInterval(async () => {
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

      if (failed.length !== logs.length) {
        await clearLogs();
        for (const fail of failed) {
          await addLogToQueue(fail);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);
}

export default useDisplayLogsQueue;
