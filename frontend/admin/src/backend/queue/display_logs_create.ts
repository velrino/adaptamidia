import { IApiCreateDisplayLogRequest } from "../api/api.interface";

const DB_NAME = "LogQueueDB";
const STORE_NAME = "display_logs_create";
const DB_VERSION = 1;

type QueuedDisplayLog = IApiCreateDisplayLogRequest & { capture?: Blob };

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addLogToQueue(data: QueuedDisplayLog) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.add(data);

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export async function getAllLogs(): Promise<{ key: IDBValidKey; log: QueuedDisplayLog }[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.openCursor();

  return new Promise((resolve, reject) => {
    const logs: { key: IDBValidKey; log: QueuedDisplayLog }[] = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        logs.push({ key: cursor.primaryKey, log: cursor.value });
        cursor.continue();
      }
    };
    tx.oncomplete = () => { db.close(); resolve(logs); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export async function removeLog(key: IDBValidKey) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(key);

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}
