import { Queue } from "bullmq";
import { redisConnectionOptions } from "../config/redis.js";

export const QUEUE_NAMES = {
  DOCUMENT_PROCESS: "document.process",
};

let documentQueue;

export const getDocumentQueue = () => {
  if (!documentQueue) {
    documentQueue = new Queue(QUEUE_NAMES.DOCUMENT_PROCESS, {
      connection: redisConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: 200,
        removeOnFail: 200,
      },
    });
  }
  return documentQueue;
};
