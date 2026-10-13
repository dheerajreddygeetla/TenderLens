import bcrypt from "bcryptjs";
import { query } from "../config/database.js";
import { env } from "../config/env.js";
import { httpError } from "../utils/httpError.js";
import { recordAudit } from "./audit.service.js";

const SELECT_USER = `
  SELECT
    u.id, u.email, u.full_name AS "fullName",
    u.is_active AS "isActive",
    u.mfa_enabled AS "mfaEnabled",
    u.last_login_at AS "lastLoginAt",
    u.created_at AS "createdAt",
    r.name AS role
  FROM users u
  JOIN roles r ON r.id = u.role_id
`;

export const listUsers = async () => {
  const { rows } = await query(`${SELECT_USER} ORDER BY u.created_at DESC`);
  return rows;
};

export const listRolesWithPermissions = async () => {
  const { rows: roles } = await query(`SELECT id, name, description FROM roles ORDER BY name`);
  const { rows: perms } = await query(
    `SELECT r.name AS role, p.code
     FROM role_permissions rp
     JOIN roles r ON r.id = rp.role_id
     JOIN permissions p ON p.id = rp.permission_id
     ORDER BY r.name, p.code`
  );
  const map = new Map(roles.map((r) => [r.name, { ...r, permissions: [] }]));
  for (const p of perms) {
    const entry = map.get(p.role);
    if (entry) entry.permissions.push(p.code);
  }
  return Array.from(map.values());
};

export const createUser = async (payload, actor, meta = {}) => {
  const { email, fullName, password, roleName } = payload;

  const { rows: roleRows } = await query(`SELECT id FROM roles WHERE name = $1`, [roleName]);
  if (!roleRows.length) throw httpError(400, "Unknown role");
  const roleId = roleRows[0].id;

  const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  try {
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name, role_id, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id`,
      [email, hash, fullName, roleId]
    );

    await recordAudit({
      userId: actor?.id ?? null,
      action: "user.create",
      resourceType: "user",
      resourceId: rows[0].id,
      metadata: { email, roleName },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    const { rows: outRows } = await query(`${SELECT_USER} WHERE u.id = $1`, [rows[0].id]);
    return outRows[0];
  } catch (err) {
    if (err.code === "23505") throw httpError(409, "Email already exists");
    throw err;
  }
};

export const updateUser = async (id, payload, actor, meta = {}) => {
  const sets = [];
  const params = [];
  const push = (col, val) => {
    params.push(val);
    sets.push(`${col} = $${params.length}`);
  };

  if (payload.fullName !== undefined) push("full_name", payload.fullName);
  if (payload.isActive !== undefined) push("is_active", !!payload.isActive);

  if (payload.roleName !== undefined) {
    const { rows: roleRows } = await query(`SELECT id FROM roles WHERE name = $1`, [payload.roleName]);
    if (!roleRows.length) throw httpError(400, "Unknown role");
    push("role_id", roleRows[0].id);
  }

  if (!sets.length) throw httpError(400, "No updatable fields");

  params.push(id);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (!rows.length) throw httpError(404, "User not found");

  if (payload.isActive === false) {
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [id]
    );
  }

  await recordAudit({
    userId: actor?.id ?? null,
    action: "user.update",
    resourceType: "user",
    resourceId: id,
    metadata: { fields: sets.map((s) => s.split(" ")[0]) },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  const { rows: outRows } = await query(`${SELECT_USER} WHERE u.id = $1`, [id]);
  return outRows[0];
};
