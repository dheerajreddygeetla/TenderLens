import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

if (env.isProd) {
  logger.error("Refusing to reset database in production");
  process.exit(1);
}

const main = async () => {
  await pool.query(`
    DROP TABLE IF EXISTS
      entity_matches,
      graph_sync_runs,
      notifications,
      review_notes,
      review_indicators,
      analysis_runs,
      document_chunks,
      documents,
      contract_amendments,
      contracts,
      bids,
      tenders,
      projects,
      companies,
      locations,
      departments,
      audit_logs,
      password_resets,
      refresh_tokens,
      users,
      role_permissions,
      permissions,
      roles,
      schema_migrations
    CASCADE;
  `);
  logger.info("Database reset complete");
};

main()
  .then(() => pool.end())
  .catch(async (err) => {
    logger.error("Reset failed", { message: err.message });
    await pool.end().catch(() => {});
    process.exit(1);
  });
