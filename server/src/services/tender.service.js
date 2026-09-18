import { query, withTransaction } from "../config/database.js";
import { httpError } from "../utils/httpError.js";
import { buildPagination, parsePagination, parseSort } from "../utils/pagination.js";
import { recordAudit } from "./audit.service.js";

const SORT_COLUMNS = [
  "published_at",
  "deadline_at",
  "estimated_value",
  "created_at",
  "title",
  "tender_code",
  "status",
];

const SELECT_TENDER_BASE = `
  SELECT
    t.id,
    t.tender_code      AS "tenderCode",
    t.title,
    t.description,
    t.department_id    AS "departmentId",
    d.name             AS "departmentName",
    d.code             AS "departmentCode",
    t.location_id      AS "locationId",
    l.name             AS "locationName",
    l.state            AS "locationState",
    t.project_id       AS "projectId",
    p.name             AS "projectName",
    t.estimated_value  AS "estimatedValue",
    t.currency,
    t.status,
    t.published_at     AS "publishedAt",
    t.deadline_at      AS "deadlineAt",
    t.created_at       AS "createdAt",
    t.updated_at       AS "updatedAt"
  FROM tenders t
  LEFT JOIN departments d ON d.id = t.department_id
  LEFT JOIN locations   l ON l.id = t.location_id
  LEFT JOIN projects    p ON p.id = t.project_id
`;

export const listTenders = async (q) => {
  const { page, limit, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, SORT_COLUMNS, { column: "published_at", dir: "DESC" });

  const where = [];
  const params = [];
  const push = (sql, val) => {
    params.push(val);
    where.push(sql.replace("$?", `$${params.length}`));
  };

  if (q.search) {
    params.push(`%${q.search}%`);
    const p = `$${params.length}`;
    where.push(
      `(t.tender_code ILIKE ${p} OR t.title ILIKE ${p} OR COALESCE(t.description,'') ILIKE ${p} OR COALESCE(d.name,'') ILIKE ${p} OR COALESCE(l.name,'') ILIKE ${p})`
    );
  }
  if (q.status) push("t.status = $?", q.status);
  if (q.departmentId) push("t.department_id = $?", q.departmentId);
  if (q.locationId) push("t.location_id = $?", q.locationId);
  if (typeof q.minValue === "number") push("t.estimated_value >= $?", q.minValue);
  if (typeof q.maxValue === "number") push("t.estimated_value <= $?", q.maxValue);

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM tenders t
    LEFT JOIN departments d ON d.id = t.department_id
    LEFT JOIN locations   l ON l.id = t.location_id
    ${whereSql}
  `;
  const { rows: countRows } = await query(countSql, params);
  const total = countRows[0].total;

  const dataSql = `
    ${SELECT_TENDER_BASE}
    ${whereSql}
    ORDER BY t.${sortBy} ${sortDir} NULLS LAST
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const { rows } = await query(dataSql, [...params, limit, offset]);

  return { items: rows, pagination: buildPagination(total, page, limit) };
};

export const getTenderById = async (id) => {
  const { rows } = await query(`${SELECT_TENDER_BASE} WHERE t.id = $1 LIMIT 1`, [id]);
  if (!rows.length) throw httpError(404, "Tender not found");
  return rows[0];
};

export const createTender = async (payload, user, meta = {}) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO tenders
         (tender_code, title, description, department_id, location_id, project_id,
          estimated_value, currency, status, published_at, deadline_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        payload.tenderCode,
        payload.title,
        payload.description ?? null,
        payload.departmentId ?? null,
        payload.locationId ?? null,
        payload.projectId ?? null,
        payload.estimatedValue ?? null,
        payload.currency ?? "INR",
        payload.status ?? "open",
        payload.publishedAt ?? null,
        payload.deadlineAt ?? null,
        user?.id ?? null,
      ]
    );

    const id = rows[0].id;

    await recordAudit({
      userId: user?.id ?? null,
      action: "tender.create",
      resourceType: "tender",
      resourceId: id,
      metadata: { tenderCode: payload.tenderCode },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return getTenderByIdWithClient(client, id);
  });
};

export const updateTender = async (id, payload, user, meta = {}) => {
  const allowed = [
    ["tender_code", "tenderCode"],
    ["title", "title"],
    ["description", "description"],
    ["department_id", "departmentId"],
    ["location_id", "locationId"],
    ["project_id", "projectId"],
    ["estimated_value", "estimatedValue"],
    ["currency", "currency"],
    ["status", "status"],
    ["published_at", "publishedAt"],
    ["deadline_at", "deadlineAt"],
  ];

  const sets = [];
  const params = [];
  for (const [col, key] of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      params.push(payload[key]);
      sets.push(`${col} = $${params.length}`);
    }
  }

  if (!sets.length) return getTenderById(id);

  params.push(id);
  const sql = `UPDATE tenders SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING id`;

  const { rows } = await query(sql, params);
  if (!rows.length) throw httpError(404, "Tender not found");

  await recordAudit({
    userId: user?.id ?? null,
    action: "tender.update",
    resourceType: "tender",
    resourceId: id,
    metadata: { fields: sets.map((s) => s.split(" ")[0]) },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return getTenderById(id);
};

export const deleteTender = async (id, user, meta = {}) => {
  const { rows } = await query("DELETE FROM tenders WHERE id = $1 RETURNING tender_code", [id]);
  if (!rows.length) throw httpError(404, "Tender not found");

  await recordAudit({
    userId: user?.id ?? null,
    action: "tender.delete",
    resourceType: "tender",
    resourceId: id,
    metadata: { tenderCode: rows[0].tender_code },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { ok: true };
};

// helper used inside transaction — same shape as getTenderById
const getTenderByIdWithClient = async (client, id) => {
  const { rows } = await client.query(`${SELECT_TENDER_BASE} WHERE t.id = $1 LIMIT 1`, [id]);
  return rows[0];
};
