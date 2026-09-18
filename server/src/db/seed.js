import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../config/database.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

import { seedProcurementBase } from "./seeds/procurement-base.js";
import { seedTenders } from "./seeds/procurement-tenders.js";

// -----------------------------------------------------------------------------
// Roles
// -----------------------------------------------------------------------------
const ROLES = [
  { name: "admin",   description: "Full system administrator" },
  { name: "officer", description: "Procurement officer" },
  { name: "auditor", description: "Auditor / investigator" },
  { name: "viewer",  description: "Read-only viewer" },
];

// -----------------------------------------------------------------------------
// Permissions
// -----------------------------------------------------------------------------
const PERMISSIONS = [
  ["tender:read",   "View tenders"],
  ["tender:create", "Create tenders"],
  ["tender:update", "Update tenders"],
  ["tender:delete", "Delete tenders"],
  ["document:read",   "View documents"],
  ["document:upload", "Upload documents"],
  ["document:delete", "Delete documents"],
  ["analysis:run",  "Run AI analysis"],
  ["analysis:read", "View AI analysis"],
  ["risk:read",   "View review indicators"],
  ["risk:update", "Update review indicator status"],
  ["company:read",   "View companies"],
  ["company:update", "Update companies"],
  ["contract:read",   "View contracts"],
  ["contract:update", "Update contracts"],
  ["user:read",    "View users"],
  ["user:create",  "Create users"],
  ["user:update",  "Update users"],
  ["user:disable", "Disable users"],
  ["role:read",   "View roles"],
  ["role:update", "Update roles & permissions"],
  ["audit:read", "View audit logs"],
  ["settings:read",   "View system settings"],
  ["settings:update", "Update system settings"],
];

const ROLE_PERMISSIONS = {
  admin: PERMISSIONS.map(([code]) => code),
  officer: [
    "tender:read", "tender:create", "tender:update",
    "document:read", "document:upload",
    "analysis:run", "analysis:read",
    "risk:read", "risk:update",
    "company:read",
    "contract:read", "contract:update",
    "audit:read",
  ],
  auditor: [
    "tender:read", "document:read",
    "analysis:read",
    "risk:read", "risk:update",
    "company:read",
    "contract:read",
    "audit:read",
  ],
  viewer: [
    "tender:read", "document:read",
    "analysis:read",
    "risk:read",
    "company:read",
    "contract:read",
  ],
};

const DEMO_USERS = [
  { email: "admin@tenderlens.local",   fullName: "Admin User",   role: "admin",   password: "Admin@12345" },
  { email: "officer@tenderlens.local", fullName: "Priya Sharma", role: "officer", password: "Officer@12345" },
  { email: "auditor@tenderlens.local", fullName: "Rahul Verma",  role: "auditor", password: "Auditor@12345" },
  { email: "viewer@tenderlens.local",  fullName: "Guest Viewer", role: "viewer",  password: "Viewer@12345" },
];

// -----------------------------------------------------------------------------
// Users / RBAC
// -----------------------------------------------------------------------------
const seedRolesAndPermissions = async (client) => {
  for (const r of ROLES) {
    await client.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
      [r.name, r.description]
    );
  }

  for (const [code, description] of PERMISSIONS) {
    await client.query(
      `INSERT INTO permissions (code, description)
       VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`,
      [code, description]
    );
  }

  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    const { rows } = await client.query("SELECT id FROM roles WHERE name = $1", [roleName]);
    const roleId = rows[0].id;

    await client.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);

    for (const code of codes) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT $1, id FROM permissions WHERE code = $2
         ON CONFLICT DO NOTHING`,
        [roleId, code]
      );
    }
  }
};

const seedUsers = async (client) => {
  const rounds = env.BCRYPT_ROUNDS;

  for (const u of DEMO_USERS) {
    const { rows: roleRows } = await client.query("SELECT id FROM roles WHERE name = $1", [u.role]);
    if (!roleRows.length) throw new Error(`Role not found: ${u.role}`);
    const roleId = roleRows[0].id;

    const hash = await bcrypt.hash(u.password, rounds);

    await client.query(
      `INSERT INTO users (email, password_hash, full_name, role_id, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT ((LOWER(email)))
       DO UPDATE SET password_hash = EXCLUDED.password_hash,
                     full_name     = EXCLUDED.full_name,
                     role_id       = EXCLUDED.role_id,
                     is_active     = TRUE`,
      [u.email, hash, u.fullName, roleId]
    );
  }

  logger.info(`Seeded ${DEMO_USERS.length} demo users`);
};

const findAdminId = async (client) => {
  const { rows } = await client.query(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'admin' LIMIT 1`
  );
  return rows[0]?.id || null;
};

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
const main = async () => {
  await withTransaction(async (client) => {
    await seedRolesAndPermissions(client);
    await seedUsers(client);
  });

  // Procurement base (idempotent upserts — no transaction needed)
  await withTransaction(async (client) => {
    await seedProcurementBase(client);
  });

  // Tenders (needs admin author id)
  await withTransaction(async (client) => {
    const adminId = await findAdminId(client);
    await seedTenders(client, { count: 120, createdBy: adminId });
  });

  logger.info("Seed complete");
};

main()
  .then(() => pool.end())
  .catch(async (err) => {
    logger.error("Seed failed", { message: err.message, stack: err.stack });
    await pool.end().catch(() => {});
    process.exit(1);
  });
