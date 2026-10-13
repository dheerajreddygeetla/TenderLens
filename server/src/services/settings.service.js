import { query } from "../config/database.js";
import { httpError } from "../utils/httpError.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { recordAudit } from "./audit.service.js";

export const getProfile = async (userId) => {
  const { rows } = await query(
    `SELECT u.id, u.email, u.full_name AS "fullName",
            u.mfa_enabled AS "mfaEnabled",
            u.last_login_at AS "lastLoginAt",
            u.created_at AS "createdAt",
            r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId]
  );
  if (!rows.length) throw httpError(404, "User not found");
  return rows[0];
};

export const updateProfile = async (userId, { fullName }, meta = {}) => {
  if (!fullName || fullName.trim().length < 2) throw httpError(400, "Full name is required");
  await query(`UPDATE users SET full_name = $1 WHERE id = $2`, [fullName.trim(), userId]);
  await recordAudit({
    userId,
    action: "settings.profile.update",
    resourceType: "user",
    resourceId: userId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return getProfile(userId);
};

export const changePassword = async (userId, { currentPassword, newPassword }, meta = {}) => {
  const { rows } = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
  const hash = rows[0]?.password_hash;
  if (!hash) throw httpError(404, "User not found");

  const ok = await verifyPassword(currentPassword, hash);
  if (!ok) throw httpError(401, "Current password is incorrect");

  const newHash = await hashPassword(newPassword);
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHash, userId]);

  await recordAudit({
    userId,
    action: "settings.password.change",
    resourceType: "user",
    resourceId: userId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { ok: true };
};

export const listSessions = async (userId) => {
  const { rows } = await query(
    `SELECT id, ip, user_agent AS "userAgent",
            created_at AS "createdAt", expires_at AS "expiresAt",
            revoked_at AS "revokedAt",
            (revoked_at IS NULL AND expires_at > NOW()) AS "active"
     FROM refresh_tokens
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return rows;
};

export const revokeSession = async (userId, sessionId, meta = {}) => {
  const { rowCount } = await query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [sessionId, userId]
  );
  if (rowCount === 0) throw httpError(404, "Session not found or already revoked");

  await recordAudit({
    userId,
    action: "settings.session.revoke",
    resourceType: "session",
    resourceId: sessionId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return { ok: true };
};

export const revokeOtherSessions = async (userId, currentRefreshToken, meta = {}) => {
  // Revoke all sessions except the one matching currentRefreshToken (if provided)
  const { createHash } = await import("node:crypto");
  const sha256 = (v) => createHash("sha256").update(v).digest("hex");

  if (currentRefreshToken) {
    const keepHash = sha256(currentRefreshToken);
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL AND token_hash <> $2`,
      [userId, keepHash]
    );
  } else {
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }

  await recordAudit({
    userId,
    action: "settings.session.revoke_others",
    resourceType: "user",
    resourceId: userId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return { ok: true };
};
