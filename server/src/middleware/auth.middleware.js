import { verifyAccessToken } from "../utils/jwt.js";
import { httpError } from "../utils/httpError.js";

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
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
