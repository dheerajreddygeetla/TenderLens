import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    issuer: "tenderlens",
    audience: "tenderlens-web",
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, {
    issuer: "tenderlens",
    audience: "tenderlens-web",
  });
