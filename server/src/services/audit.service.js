import { query } from "../config/database.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";
import { logger } from "../utils/logger.js";

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

export const listAuditLogs = async (q) => {
  const { page, limit, offset } = parsePagination(q, { defaultLimit: 50, maxLimit: 200 });

  const where = [];
  const params = [];
  const push = (sql, val) => {
    params.push(val);
    where.push(sql.replace("$?", `$${params.length}`));
  };

  if (q.userId) push("al.user_id = $?", q.userId);
  if (q.action) {
    params.push(`%${q.action}%`);
    where.push(`al.action ILIKE $${params.length}`);
  }
  if (q.resourceType) push("al.resource_type = $?", q.resourceType);
  if (q.resourceId) push("al.resource_id = $?", q.resourceId);
  if (q.result) push("al.result = $?", q.result);
  if (q.from) push("al.created_at >= $?", q.from);
  if (q.to) push("al.created_at <= $?", q.to);

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM audit_logs al ${whereSql}`,
    params
  );
  const total = countRows[0].total;

  const { rows } = await query(
    `SELECT
       al.id, al.action, al.resource_type AS "resourceType", al.resource_id AS "resourceId",
       al.metadata, al.ip, al.user_agent AS "userAgent", al.result,
       al.created_at AS "createdAt",
       al.user_id AS "userId",
       u.email AS "userEmail", u.full_name AS "userName"
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${whereSql}
     ORDER BY al.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { items: rows, pagination: buildPagination(total, page, limit) };
};
