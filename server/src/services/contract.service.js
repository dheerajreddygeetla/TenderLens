import { query, withTransaction } from "../config/database.js";
import { httpError } from "../utils/httpError.js";
import { buildPagination, parsePagination, parseSort } from "../utils/pagination.js";
import { recordAudit } from "./audit.service.js";

const SORT_COLUMNS = [
  "contract_code",
  "original_value",
  "current_value",
  "start_date",
  "created_at",
];

const SELECT_CONTRACT_BASE = `
  SELECT
    c.id,
    c.contract_code   AS "contractCode",
    c.tender_id       AS "tenderId",
    t.tender_code     AS "tenderCode",
    t.title           AS "tenderTitle",
    c.company_id      AS "companyId",
    co.name           AS "companyName",
    c.original_value  AS "originalValue",
    c.current_value   AS "currentValue",
    c.currency,
    c.start_date      AS "startDate",
    c.end_date        AS "endDate",
    c.status,
    (SELECT COUNT(*)::int FROM contract_amendments a WHERE a.contract_id = c.id) AS "amendmentCount",
    CASE
      WHEN c.original_value IS NULL OR c.original_value = 0 THEN NULL
      ELSE ROUND(((c.current_value - c.original_value) / c.original_value) * 100, 2)
    END               AS "changePct",
    c.created_at      AS "createdAt"
  FROM contracts c
  LEFT JOIN tenders   t  ON t.id  = c.tender_id
  LEFT JOIN companies co ON co.id = c.company_id
`;

export const listContracts = async (q) => {
  const { page, limit, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, SORT_COLUMNS, { column: "created_at", dir: "DESC" });

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
      `(c.contract_code ILIKE ${p} OR COALESCE(co.name,'') ILIKE ${p} OR COALESCE(t.tender_code,'') ILIKE ${p} OR COALESCE(t.title,'') ILIKE ${p})`
    );
  }
  if (q.tenderId) push("c.tender_id = $?", q.tenderId);
  if (q.companyId) push("c.company_id = $?", q.companyId);
  if (q.status) push("c.status = $?", q.status);

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM contracts c
       LEFT JOIN tenders t   ON t.id = c.tender_id
       LEFT JOIN companies co ON co.id = c.company_id
       ${whereSql}`,
    params
  );
  const total = countRows[0].total;

  const { rows } = await query(
    `${SELECT_CONTRACT_BASE}
     ${whereSql}
     ORDER BY c.${sortBy} ${sortDir} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { items: rows, pagination: buildPagination(total, page, limit) };
};

export const getContractById = async (id) => {
  const { rows } = await query(`${SELECT_CONTRACT_BASE} WHERE c.id = $1 LIMIT 1`, [id]);
  if (!rows.length) throw httpError(404, "Contract not found");

  const { rows: amendments } = await query(
    `SELECT
       id, amendment_no AS "amendmentNo", description,
       value_delta    AS "valueDelta",
       value_delta    AS "valueChange",
       new_end_date   AS "newEndDate",
       created_at     AS "createdAt",
       created_at     AS "effectiveDate"
     FROM contract_amendments
     WHERE contract_id = $1
     ORDER BY amendment_no ASC`,
    [id]
  );

  return { ...rows[0], amendments };
};

export const listContractsForTender = async (tenderId) => {
  const { rows } = await query(
    `${SELECT_CONTRACT_BASE} WHERE c.tender_id = $1 ORDER BY c.created_at DESC`,
    [tenderId]
  );
  return rows;
};

export const addAmendment = async (contractId, payload, user, meta = {}) => {
  return withTransaction(async (client) => {
    const { rows: contractRows } = await client.query(
      `SELECT id, original_value, current_value FROM contracts WHERE id = $1 FOR UPDATE`,
      [contractId]
    );
    if (!contractRows.length) throw httpError(404, "Contract not found");

    const contract = contractRows[0];

    const { rows: maxRows } = await client.query(
      `SELECT COALESCE(MAX(amendment_no), 0)::int AS max_no
       FROM contract_amendments WHERE contract_id = $1`,
      [contractId]
    );
    const nextNo = maxRows[0].max_no + 1;

    await client.query(
      `INSERT INTO contract_amendments
         (contract_id, amendment_no, description, value_delta, new_end_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        contractId,
        nextNo,
        payload.description ?? null,
        payload.valueDelta,
        payload.newEndDate ?? null,
        user?.id ?? null,
      ]
    );

    const newCurrent = Number(contract.current_value) + Number(payload.valueDelta);

    await client.query(
      `UPDATE contracts SET current_value = $1 WHERE id = $2`,
      [newCurrent, contractId]
    );

    await recordAudit({
      userId: user?.id ?? null,
      action: "contract.amend",
      resourceType: "contract",
      resourceId: contractId,
      metadata: { amendmentNo: nextNo, valueDelta: payload.valueDelta },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return nextNo;
  });
};
