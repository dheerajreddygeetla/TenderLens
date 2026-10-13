import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { ensureStorageRoot } from "./config/storage.js";
import { startWorkers, stopWorkers } from "./jobs/index.js";
import { closeDriver as closeNeo4j } from "./config/neo4j.js";
import { initRealtime } from "./services/realtime.js";

const start = async () => {
  await ensureStorageRoot();
  const workers = startWorkers();

  const httpServer = http.createServer(app);
  initRealtime(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`TenderLens API listening on http://localhost:${env.PORT}`);
    logger.info(`Realtime socket on same port (path /socket.io)`);
    logger.info(`Workers running: ${workers.length}`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    try { await stopWorkers(); } catch { /* ignore */ }
    try { await closeNeo4j(); } catch { /* ignore */ }
    httpServer.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("unhandledRejection", (r) => logger.error("Unhandled promise rejection", { reason: String(r) }));
  process.on("uncaughtException", (e) => {
    logger.error("Uncaught exception", { message: e.message, stack: e.stack });
    process.exit(1);
  });
};

start();
