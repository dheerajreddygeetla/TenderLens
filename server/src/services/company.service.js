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
  if (q.industry) { params.push(q.industry); where.push(`c.industry = $${params.length}`); }
  if (q.locationId) { params.push(q.locationId); where.push(`c.location_id = $${params.length}`); }

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
  return rows[0];
};

// -----------------------------------------------------------------------------
// Company profile aggregates
// -----------------------------------------------------------------------------

export const getCompanySummary = async (companyId) => {
  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM bids WHERE company_id = $1) AS "tendersParticipated",
       (SELECT COUNT(*)::int FROM bids WHERE company_id = $1 AND status = 'awarded') AS "tendersWon",
       (SELECT COUNT(*)::int FROM contracts WHERE company_id = $1) AS "contractCount",
       (SELECT COALESCE(SUM(current_value),0)::numeric FROM contracts WHERE company_id = $1) AS "totalContractValue",
       (SELECT COUNT(DISTINCT t.department_id)::int
          FROM bids b JOIN tenders t ON t.id = b.tender_id
          WHERE b.company_id = $1 AND t.department_id IS NOT NULL) AS "departments",
       (SELECT COUNT(*)::int FROM review_indicators WHERE company_id = $1) AS "reviewIndicators"
    `,
    [companyId]
  );
  const s = rows[0];
  return {
    tendersParticipated: Number(s.tendersParticipated) || 0,
    tendersWon: Number(s.tendersWon) || 0,
    contractCount: Number(s.contractCount) || 0,
    totalContractValue: Number(s.totalContractValue) || 0,
    departments: Number(s.departments) || 0,
    reviewIndicators: Number(s.reviewIndicators) || 0,
  };
};

export const listCompanyTenders = async (companyId, { limit = 100 } = {}) => {
  const { rows } = await query(
    `SELECT
       t.id, t.tender_code AS "tenderCode", t.title, t.status,
       t.estimated_value AS "estimatedValue", t.currency,
       t.published_at AS "publishedAt",
       d.name AS "departmentName",
       b.amount AS "bidAmount", b.rank, b.status AS "bidStatus",
       b.submitted_at AS "submittedAt"
     FROM bids b
     JOIN tenders t ON t.id = b.tender_id
     LEFT JOIN departments d ON d.id = t.department_id
     WHERE b.company_id = $1
     ORDER BY b.submitted_at DESC
     LIMIT $2`,
    [companyId, limit]
  );
  return rows;
};

export const listCompanyContracts = async (companyId, { limit = 100 } = {}) => {
  const { rows } = await query(
    `SELECT
       c.id, c.contract_code AS "contractCode",
       c.original_value AS "originalValue", c.current_value AS "currentValue",
       c.currency, c.status, c.start_date AS "startDate", c.end_date AS "endDate",
       t.id AS "tenderId", t.tender_code AS "tenderCode", t.title AS "tenderTitle",
       (SELECT COUNT(*)::int FROM contract_amendments a WHERE a.contract_id = c.id) AS "amendmentCount"
     FROM contracts c
     LEFT JOIN tenders t ON t.id = c.tender_id
     WHERE c.company_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2`,
    [companyId, limit]
  );
  return rows;
};

export const listCompanyDepartments = async (companyId) => {
  const { rows } = await query(
    `SELECT d.id, d.name, d.code,
            COUNT(b.id)::int AS "participations",
            COALESCE(SUM(b.amount),0)::numeric AS "totalBidValue"
     FROM bids b
     JOIN tenders t ON t.id = b.tender_id
     JOIN departments d ON d.id = t.department_id
     WHERE b.company_id = $1
     GROUP BY d.id, d.name, d.code
     ORDER BY "participations" DESC`,
    [companyId]
  );
  return rows.map((r) => ({
    departmentId: r.id,
    name: r.name,
    code: r.code,
    participations: Number(r.participations) || 0,
    totalBidValue: Number(r.totalBidValue) || 0,
  }));
};

export const listCompanyTimeline = async (companyId, { limit = 200 } = {}) => {
  const { rows } = await query(
    `SELECT * FROM (
        SELECT 'bid' AS kind, b.submitted_at AS at,
               jsonb_build_object(
                 'tenderId', t.id,
                 'tenderCode', t.tender_code,
                 'title', t.title,
                 'amount', b.amount,
                 'rank', b.rank,
                 'status', b.status
               ) AS payload
        FROM bids b JOIN tenders t ON t.id = b.tender_id
        WHERE b.company_id = $1
        UNION ALL
        SELECT 'contract' AS kind, c.created_at AS at,
               jsonb_build_object(
                 'contractId', c.id,
                 'contractCode', c.contract_code,
                 'originalValue', c.original_value,
                 'currentValue', c.current_value,
                 'status', c.status
               ) AS payload
        FROM contracts c WHERE c.company_id = $1
     ) x
     ORDER BY x.at DESC
     LIMIT $2`,
    [companyId, limit]
  );
  return rows;
};

// -----------------------------------------------------------------------------
// CRUD
// -----------------------------------------------------------------------------

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
