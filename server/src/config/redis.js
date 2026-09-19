import IORedis from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const REDIS_URL = env.REDIS_URL || "redis://localhost:6379";

/**
 * BullMQ requires maxRetriesPerRequest = null.
 * We expose two connections: one for producers (queues), one for workers.
 */
export const createRedis = (role = "client") =>
  new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 200, 3000),
    connectionName: `tenderlens-${role}`,
  });

export const redis = createRedis("producer");

redis.on("error", (err) => logger.warn("Redis error", { message: err.message }));
redis.on("connect", () => logger.info("Redis connected"));

export const redisConnectionOptions = () => ({
  url: REDIS_URL,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectionName: "tenderlens-worker",
});
