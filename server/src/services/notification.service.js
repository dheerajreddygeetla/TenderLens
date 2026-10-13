import { query } from "../config/database.js";
import { emitToUser, emitToRole } from "./realtime.js";
import { logger } from "../utils/logger.js";

export const createNotification = async ({
  userId = null,
  kind,
  title,
  body = null,
  resourceType = null,
  resourceId = null,
}) => {
  try {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, kind, title, body, resource_type, resource_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, user_id AS "userId", kind, title, body,
                 resource_type AS "resourceType", resource_id AS "resourceId",
                 read_at AS "readAt", created_at AS "createdAt"`,
      [userId, kind, title, body, resourceType, resourceId]
    );
    const n = rows[0];
    if (userId) emitToUser(userId, "notification:new", n);
    return n;
  } catch (err) {
    logger.warn("Failed to create notification", { message: err.message });
    return null;
  }
};

export const notifyRole = async (roleName, payload) => {
  const { rows } = await query(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
     WHERE r.name = $1 AND u.is_active = TRUE`,
    [roleName]
  );
  const results = [];
  for (const r of rows) {
    results.push(await createNotification({ ...payload, userId: r.id }));
  }
  // Also broadcast a role-level ping so any tab currently connected updates counts
  if (rows.length) emitToRole(roleName, "notification:role-ping", { kind: payload.kind });
  return results;
};

export const listNotifications = async (userId, { unreadOnly = false } = {}) => {
  const params = [userId];
  let where = "WHERE user_id = $1";
  if (unreadOnly) where += " AND read_at IS NULL";

  const { rows } = await query(
    `SELECT id, kind, title, body,
            resource_type AS "resourceType", resource_id AS "resourceId",
            read_at AS "readAt", created_at AS "createdAt"
     FROM notifications
     ${where}
     ORDER BY created_at DESC
     LIMIT 200`,
    params
  );
  return rows;
};

export const countUnread = async (userId) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n FROM notifications
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return rows[0].n;
};

export const markRead = async (userId, id) => {
  await query(
    `UPDATE notifications SET read_at = NOW()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
    [id, userId]
  );
};

export const markAllRead = async (userId) => {
  await query(
    `UPDATE notifications SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
};
