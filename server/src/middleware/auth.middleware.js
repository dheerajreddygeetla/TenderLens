import { verifyAccessToken } from "../utils/jwt.js";
import { httpError } from "../utils/httpError.js";

export const authenticate = (req, res, next) => {
  let token = null;
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    token = header.slice(7).trim();
  } else if (req.query?.token) {
    token = String(req.query.token);
  }

  if (!token) {
    return next(httpError(401, "Authentication required"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    };
    return next();
  } catch {
    return next(httpError(401, "Invalid or expired token"));
  }
};
