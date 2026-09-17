import dotenv from "dotenv";
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";

const requiredInProduction = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"];
if (NODE_ENV === "production") {
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var in production: ${key}`);
    }
  }
}

export const env = {
  NODE_ENV,
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL || "",

  JWT_SECRET: process.env.JWT_SECRET || "dev-only-secret-change-me",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev-only-refresh-secret",
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",

  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:8000",
};
