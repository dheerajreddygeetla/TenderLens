import { query } from "../config/database.js";
import { httpError } from "../utils/httpError.js";
import { buildPagination, parsePagination, parseSort } from "../utils/pagination.js";
import { recordAudit } from "./audit.service.js";

const SORT_COLUMNS = ["name", "industry", "created_at"];

const SELECT_COMPANY_BASE = `
  SELECT
    c.id,
    c.name,
    c.registration_id AS "registrationId",
    c.industry,
    c.is_active       AS "isActive",
    c.location_id     AS "locationId",
    l.name            AS "locationName",
    l.state           AS "locationState",
    c.created_at      AS "createdAt"
  FROM companies c
  LEFT JOIN locations l ON l.id = c.location_id
`;

export const listCompanies = async (q) => {
  const { page, limit, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, SORT_COLUMNS, { column: "name", dir: "ASC" });

  const where = [];
  const params = [];

  if (q.search) {
    params.push(`%${q.search}%`);
    const p = `$${params.length}`;
    where.push(
      `(c.name ILIKE ${p} OR COALESCE(c.registration_id,'') ILIKE ${p} OR COALESCE(c.industry,'') ILIKE ${p})`
    );
  }
  if (q.industry) {
    params.push(q.industry);
    where.push(`c.industry = $${params.length}`);
  }
  if (q.locationId) {
    params.push(q.locationId);
    where.push(`c.location_id = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM companies c ${whereSql}`,
    params
  );
  const total = countRows[0].total;

  const { rows } = await query(
    `${SELECT_COMPANY_BASE}
     ${whereSql}
     ORDER BY c.${sortBy} ${sortDir} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { items: rows, pagination: buildPagination(total, page, limit) };
};

export const getCompanyById = async (id) => {
  const { rows } = await query(`${SELECT_COMPANY_BASE} WHERE c.id = $1 LIMIT 1`, [id]);
  if (!rows.length) throw httpError(404, "Company not found");

  // Aggregate stats
  const { rows: statsRows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM tenders) AS placeholder
    `,
    []
  );
  // Placeholder stats block — will be replaced in later days with real bid/contract tables.
  void statsRows;

  return rows[0];
};

export const createCompany = async (payload, user, meta = {}) => {
  const { rows } = await query(
    `INSERT INTO companies (name, registration_id, industry, location_id, is_active)
     VALUES ($1,$2,$3,$4,TRUE)
     RETURNING id`,
    [payload.name, payload.registrationId ?? null, payload.industry ?? null, payload.locationId ?? null]
  );

  await recordAudit({
    userId: user?.id ?? null,
    action: "company.create",
    resourceType: "company",
    resourceId: rows[0].id,
    metadata: { name: payload.name },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return getCompanyById(rows[0].id);
};

export const updateCompany = async (id, payload, user, meta = {}) => {
  const allowed = [
    ["name", "name"],
    ["registration_id", "registrationId"],
    ["industry", "industry"],
    ["location_id", "locationId"],
  ];
  const sets = [];
  const params = [];
  for (const [col, key] of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      params.push(payload[key]);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (!sets.length) return getCompanyById(id);

  params.push(id);
  const { rows } = await query(
    `UPDATE companies SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (!rows.length) throw httpError(404, "Company not found");

  await recordAudit({
    userId: user?.id ?? null,
    action: "company.update",
    resourceType: "company",
    resourceId: id,
    metadata: { fields: sets.map((s) => s.split(" ")[0]) },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return getCompanyById(id);
};
