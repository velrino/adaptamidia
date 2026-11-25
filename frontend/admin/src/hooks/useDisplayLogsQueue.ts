"use client";

import { useEffect, useRef } from "react";
import { API } from "@/backend/api/api.endpoints";
import { getAllLogs, removeLog } from "@/backend/queue/display_logs_create";

function useDisplayLogsQueue() {
  const isProcessing = useRef(false);

  useEffect(() => {
    let retryAfter = 0;
    const interval = setInterval(async () => {
      if (isProcessing.current || Date.now() < retryAfter) return;
      isProcessing.current = true;

      try {
        for (const { key, log } of await getAllLogs()) {
          const { capture, ...body } = log;
          const created = await API.display_logs.create({
            ...body,
            capture_expected: Boolean(capture),
          });
          if (!created.ok) throw new Error(`Exibição: HTTP ${created.status}`);

          if (capture) {
            const uploaded = await API.files.uploadCamera({
              file: capture,
              type: body.type,
              record: body.id,
              unit: body.local,
              timestamp: body.identifier,
            });
            if (!uploaded.ok) throw new Error(`Captura: HTTP ${uploaded.status}`);
          }

          await removeLog(key);
        }
      } catch (error) {
        retryAfter = Date.now() + 5000;
        console.error("Falha ao sincronizar a exibição:", error);
      } finally {
        isProcessing.current = false;
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return null;
}

export default useDisplayLogsQueue;
