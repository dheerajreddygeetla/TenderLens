import { logger } from "../utils/logger.js";

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
};

/* eslint-disable no-unused-vars */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error(err.message || "Unhandled error", {
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  }

  const body = {
    success: false,
    error: {
      message: status >= 500 ? "Internal server error" : err.message,
    },
  };
  if (err.details !== undefined) body.error.details = err.details;

  res.status(status).json(body);
};
