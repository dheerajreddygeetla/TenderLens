import { startDocumentWorker } from "./workers/document.worker.js";
import { logger } from "../utils/logger.js";

let workers = [];

export const startWorkers = () => {
  if (workers.length) return workers;
  workers = [startDocumentWorker()];
  logger.info(`Started ${workers.length} background worker(s)`);
  return workers;
};

export const stopWorkers = async () => {
  for (const w of workers) {
    try { await w.close(); } catch { /* ignore */ }
  }
  workers = [];
};
