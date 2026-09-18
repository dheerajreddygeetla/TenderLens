import { query, withTransaction } from "../config/database.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateOpaqueToken, sha256 } from "../utils/tokens.js";
import { httpError } from "../utils/httpError.js";
import { recordAudit } from "./audit.service.js";
import { logger } from "../utils/logger.js";

const REFRESH_TTL_MS = env.JWT_REFRESH_EXPIRES_MS;
const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const getPermissionsForRole = async (roleId) => {
  const { rows } = await query(
    `SELECT p.code
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = $1
     ORDER BY p.code`,
    [roleId]
  );
  return rows.map((r) => r.code);
};

const findUserByEmail = async (email) => {
  const { rows } = await query(
    `SELECT u.id, u.email, u.password_hash, u.full_name, u.is_active,
            u.role_id, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE LOWER(u.email) = LOWER($1)
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

const findUserById = async (id) => {
  const { rows } = await query(
    `SELECT u.id, u.email, u.full_name, u.is_active,
            u.role_id, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const toPublicUser = (user, permissions) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  role: user.role,
  permissions,
});

const issueRefreshToken = async ({ userId, ip, userAgent }) => {
  const raw = generateOpaqueToken();
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, ip, userAgent]
  );

  return raw;
};

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------
export const loginUser = async ({ email, password, ip, userAgent }) => {
  const user = await findUserByEmail(email);

  // Constant-ish response for user-not-found vs bad-password
  if (!user || !user.is_active) {
    await recordAudit({
      action: "auth.login",
      result: "failure",
      metadata: { email, reason: "user_not_found_or_inactive" },
      ip,
      userAgent,
    });
    throw httpError(401, "Invalid email or password");
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    await recordAudit({
      userId: user.id,
      action: "auth.login",
      result: "failure",
      metadata: { email, reason: "bad_password" },
      ip,
      userAgent,
    });
    throw httpError(401, "Invalid email or password");
  }

  const permissions = await getPermissionsForRole(user.role_id);

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions,
  });

  const refreshToken = await issueRefreshToken({ userId: user.id, ip, userAgent });

  await query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);

  await recordAudit({
    userId: user.id,
    action: "auth.login",
    resourceType: "user",
    resourceId: user.id,
    ip,
    userAgent,
  });

  return { user: toPublicUser(user, permissions), accessToken, refreshToken };
};

export const refreshSession = async ({ refreshToken, ip, userAgent }) => {
  if (!refreshToken) throw httpError(401, "No refresh token");

  const tokenHash = sha256(refreshToken);

  // Rotate atomically: revoke old, insert new, return new pair.
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at,
              u.is_active, u.email, u.full_name, u.role_id, r.name AS role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       JOIN roles r ON r.id = u.role_id
       WHERE rt.token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );

    const row = rows[0];
    if (!row) throw httpError(401, "Invalid refresh token");
    if (row.revoked_at) throw httpError(401, "Refresh token revoked");
    if (new Date(row.expires_at).getTime() < Date.now()) throw httpError(401, "Refresh token expired");
    if (!row.is_active) throw httpError(403, "User disabled");

    // Revoke current
    await client.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1", [row.id]);

    // New refresh
    const newRaw = generateOpaqueToken();
    const newHash = sha256(newRaw);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [row.user_id, newHash, expiresAt, ip, userAgent]
    );

    // Permissions
    const { rows: permRows } = await client.query(
      `SELECT p.code
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [row.role_id]
    );
    const permissions = permRows.map((p) => p.code);

    const accessToken = signAccessToken({
      sub: row.user_id,
      email: row.email,
      role: row.role,
      permissions,
    });

    return {
      user: toPublicUser(
        { id: row.user_id, email: row.email, full_name: row.full_name, role: row.role },
        permissions
      ),
      accessToken,
      refreshToken: newRaw,
    };
  });
};

export const logoutUser = async ({ refreshToken, userId, ip, userAgent }) => {
  if (refreshToken) {
    const tokenHash = sha256(refreshToken);
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash]
    );
  }
  await recordAudit({
    userId,
    action: "auth.logout",
    ip,
    userAgent,
  });
};

export const requestPasswordReset = async ({ email, ip, userAgent }) => {
  const user = await findUserByEmail(email);

  // Always return success-shaped response to avoid user enumeration.
  if (!user) {
    await recordAudit({
      action: "auth.forgot_password",
      result: "skipped",
      metadata: { email, reason: "user_not_found" },
      ip,
      userAgent,
    });
    return { delivered: true };
  }

  const raw = generateOpaqueToken(32);
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at, ip)
     VALUES ($1, $2, $3, $4)`,
    [user.id, tokenHash, expiresAt, ip]
  );

  // MOCKED EMAIL DELIVERY for development
  const resetUrl = `http://localhost:5173/reset-password?token=${raw}`;
  logger.info(`[MOCK EMAIL] Password reset link for ${email}: ${resetUrl}`);

  await recordAudit({
    userId: user.id,
    action: "auth.forgot_password",
    metadata: { email },
    ip,
    userAgent,
  });

  return { delivered: true, devResetToken: env.isProd ? undefined : raw };
};

export const resetPassword = async ({ token, newPassword, ip, userAgent }) => {
  if (!token) throw httpError(400, "Missing reset token");

  const tokenHash = sha256(token);

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
       FROM password_resets pr
       WHERE pr.token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );

    const row = rows[0];
    if (!row) throw httpError(400, "Invalid or expired reset token");
    if (row.used_at) throw httpError(400, "Reset token already used");
    if (new Date(row.expires_at).getTime() < Date.now()) throw httpError(400, "Reset token expired");

    const hash = await hashPassword(newPassword);

    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, row.user_id]);
    await client.query("UPDATE password_resets SET used_at = NOW() WHERE id = $1", [row.id]);

    // Revoke all sessions
    await client.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [row.user_id]
    );

    await recordAudit({
      userId: row.user_id,
      action: "auth.reset_password",
      resourceType: "user",
      resourceId: row.user_id,
      ip,
      userAgent,
    });

    return { ok: true };
  });
};

export const getMe = async (userId) => {
  const user = await findUserById(userId);
  if (!user) throw httpError(404, "User not found");
  const permissions = await getPermissionsForRole(user.role_id);
  return toPublicUser(user, permissions);
};
