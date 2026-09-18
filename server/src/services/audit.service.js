import { query } from "../config/database.js";
import { logger } from "../utils/logger.js";

/**
 * Best-effort audit logging. Never throws — audit failures must not break
 * the primary request.
 */
export const recordAudit = async ({
  userId = null,
  action,
  resourceType = null,
  resourceId = null,
  metadata = null,
  ip = null,
  userAgent = null,
  result = "success",
}) => {
  try {
    await query(
      `INSERT INTO audit_logs
        (user_id, action, resource_type, resource_id, metadata, ip, user_agent, result)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, action, resourceType, resourceId, metadata, ip, userAgent, result]
    );
  } catch (err) {
    logger.warn("Failed to write audit log", { action, message: err.message });
  }
};
