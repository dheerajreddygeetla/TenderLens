import pg from "pg";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  logger.error("Unexpected PostgreSQL pool error", { message: err.message });
});

export const query = (text, params) => pool.query(text, params);

/** Run a function inside a transaction. Commits on resolve, rolls back on throw. */
export const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore rollback error */
    }
    throw err;
  } finally {
    client.release();
  }
};

export const healthCheck = async () => {
  const res = await pool.query("SELECT 1 AS ok");
  return res.rows[0]?.ok === 1;
};
