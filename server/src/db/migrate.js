import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/database.js";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const ensureTrackingTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getApplied = async () => {
  const res = await pool.query("SELECT id FROM schema_migrations");
  return new Set(res.rows.map((r) => r.id));
};

const runOne = async (file) => {
  const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
    await client.query("COMMIT");
    logger.info(`Applied migration ${file}`);
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error(`Migration ${file} FAILED`, { message: err.message });
    throw err;
  } finally {
    client.release();
  }
};

const main = async () => {
  await ensureTrackingTable();
  const applied = await getApplied();
  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    await runOne(file);
    count += 1;
  }
  logger.info(count === 0 ? "No new migrations to apply" : `Applied ${count} migration(s)`);
};

main()
  .then(() => pool.end())
  .catch(async (err) => {
    logger.error("Migrate failed", { message: err.message });
    await pool.end().catch(() => {});
    process.exit(1);
  });
