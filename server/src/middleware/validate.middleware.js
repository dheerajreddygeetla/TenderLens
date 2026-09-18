import { httpError } from "../utils/httpError.js";

export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(
      httpError(400, "Validation failed", {
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      })
    );
  }
  req.body = result.data;
  next();
};
