import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { ensureStorageRoot } from "./config/storage.js";
import { startWorkers, stopWorkers } from "./jobs/index.js";
import { closeDriver as closeNeo4j } from "./config/neo4j.js";

const start = async () => {
  await ensureStorageRoot();

  const workers = startWorkers();

  const server = app.listen(env.PORT, () => {
    logger.info(`TenderLens API listening on http://localhost:${env.PORT}`);
    logger.info(`Health: http://localhost:${env.PORT}/api/health`);
    logger.info(`Workers running: ${workers.length}`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    try { await stopWorkers(); } catch { /* ignore */ }
    try { await closeNeo4j(); } catch { /* ignore */ }
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", { reason: String(reason) });
  });
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { message: err.message, stack: err.stack });
    process.exit(1);
  });
};

start();
