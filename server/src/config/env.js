import dotenv from "dotenv";
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";

const requiredInProduction = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"];
if (NODE_ENV === "production") {
  for (const key of requiredInProduction) {
    if (!process.env[key]) throw new Error(`Missing required env var in production: ${key}`);
  }
}

/** Parse "15m", "7d", "30s", "2h" → milliseconds. Defaults to 7d. */
const parseDurationToMs = (value, fallbackMs = 7 * 24 * 3600 * 1000) => {
  if (!value || typeof value !== "string") return fallbackMs;
  const m = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!m) return fallbackMs;
  const n = Number(m[1]);
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2]];
  return n * unit;
};

export const env = {
  NODE_ENV,
  isProd: NODE_ENV === "production",
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL || "",

  JWT_SECRET: process.env.JWT_SECRET || "dev-only-secret-change-me",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev-only-refresh-secret",
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",
  JWT_REFRESH_EXPIRES_MS: parseDurationToMs(process.env.JWT_REFRESH_EXPIRES, 7 * 24 * 3600 * 1000),

  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 12,

  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:8000",
};
