import { httpError } from "../utils/httpError.js";

const runSchema = (schema, payload) => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw httpError(400, "Validation failed", {
      issues: result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }
  return result.data;
};

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = runSchema(schema, req.body);
    next();
  } catch (err) {
    next(err);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.validatedQuery = runSchema(schema, req.query);
    next();
  } catch (err) {
    next(err);
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    req.validatedParams = runSchema(schema, req.params);
    next();
  } catch (err) {
    next(err);
  }
};
