import { httpError } from "../utils/httpError.js";

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(httpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(httpError(403, "Forbidden: insufficient role"));
    }
    next();
  };

export const requirePermission =
  (...required) =>
  (req, res, next) => {
    if (!req.user) return next(httpError(401, "Authentication required"));
    const perms = req.user.permissions || [];
    const ok = required.every((p) => perms.includes(p));
    if (!ok) return next(httpError(403, "Forbidden: missing permission"));
    next();
  };

export const requireAnyPermission =
  (...required) =>
  (req, res, next) => {
    if (!req.user) return next(httpError(401, "Authentication required"));
    const perms = req.user.permissions || [];
    const ok = required.some((p) => perms.includes(p));
    if (!ok) return next(httpError(403, "Forbidden: missing permission"));
    next();
  };
