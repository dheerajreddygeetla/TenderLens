import { query } from "../config/database.js";
import { httpError } from "../utils/httpError.js";
import { buildPagination, parsePagination, parseSort } from "../utils/pagination.js";
import { recordAudit } from "./audit.service.js";

const SORT_COLUMNS = ["amount", "submitted_at", "created_at", "rank"];

const SELECT_BID_BASE = `
  SELECT
    b.id,
    b.tender_id     AS "tenderId",
    t.tender_code   AS "tenderCode",
    t.title         AS "tenderTitle",
    t.estimated_value AS "estimatedValue",
    t.currency      AS "tenderCurrency",
    b.company_id    AS "companyId",
    c.name          AS "companyName",
    b.amount,
    b.currency,
    b.submitted_at  AS "submittedAt",
    b.status,
    b.rank,
    CASE
      WHEN t.estimated_value IS NULL OR t.estimated_value = 0 THEN NULL
      ELSE ROUND(((b.amount - t.estimated_value) / t.estimated_value) * 100, 2)
    END             AS "deviationPct"
  FROM bids b
  JOIN tenders t   ON t.id = b.tender_id
  JOIN companies c ON c.id = b.company_id
`;

export const listBids = async (q) => {
  const { page, limit, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, SORT_COLUMNS, { column: "amount", dir: "ASC" });

  const where = [];
  const params = [];
  const push = (sql, val) => {
    params.push(val);
    where.push(sql.replace("$?", `$${params.length}`));
  };

  if (q.tenderId) push("b.tender_id = $?", q.tenderId);
  if (q.companyId) push("b.company_id = $?", q.companyId);
  if (q.status) push("b.status = $?", q.status);
  if (typeof q.minAmount === "number") push("b.amount >= $?", q.minAmount);
  if (typeof q.maxAmount === "number") push("b.amount <= $?", q.maxAmount);

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM bids b ${whereSql}`,
    params
  );
  const total = countRows[0].total;

  const { rows } = await query(
    `${SELECT_BID_BASE}
     ${whereSql}
     ORDER BY b.${sortBy} ${sortDir} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { items: rows, pagination: buildPagination(total, page, limit) };
};

export const getBidById = async (id) => {
  const { rows } = await query(`${SELECT_BID_BASE} WHERE b.id = $1 LIMIT 1`, [id]);
  if (!rows.length) throw httpError(404, "Bid not found");
  return rows[0];
};

/** Bids for a specific tender, ordered by amount ascending (rank). */
export const listBidsForTender = async (tenderId) => {
  const { rows } = await query(
    `${SELECT_BID_BASE}
     WHERE b.tender_id = $1
     ORDER BY b.amount ASC NULLS LAST`,
    [tenderId]
  );
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
};

/**
 * Aggregated bid stats for a tender:
 * min, max, avg, count, estimated, deviation envelope, winning bid.
 */
export const getBidStatsForTender = async (tenderId) => {
  const { rows } = await query(
    `SELECT
       t.id              AS "tenderId",
       t.tender_code     AS "tenderCode",
       t.estimated_value AS "estimatedValue",
       t.currency,
       COUNT(b.id)::int  AS "bidCount",
       MIN(b.amount)     AS "lowestBid",
       MAX(b.amount)     AS "highestBid",
       AVG(b.amount)     AS "averageBid",
       (SELECT b2.amount FROM bids b2
          WHERE b2.tender_id = t.id AND b2.status = 'awarded'
          LIMIT 1)      AS "winningBid"
     FROM tenders t
     LEFT JOIN bids b ON b.tender_id = t.id
     WHERE t.id = $1
     GROUP BY t.id`,
    [tenderId]
  );
  if (!rows.length) throw httpError(404, "Tender not found");

  const s = rows[0];
  const estimated = s.estimatedValue ? Number(s.estimatedValue) : null;
  const lowest = s.lowestBid !== null ? Number(s.lowestBid) : null;
  const highest = s.highestBid !== null ? Number(s.highestBid) : null;
  const average = s.averageBid !== null ? Number(s.averageBid) : null;
  const winning = s.winningBid !== null ? Number(s.winningBid) : null;

  const pct = (v) =>
    estimated && v !== null ? Number((((v - estimated) / estimated) * 100).toFixed(2)) : null;

  return {
    ...s,
    estimatedValue: estimated,
    lowestBid: lowest,
    highestBid: highest,
    averageBid: average,
    winningBid: winning,
    lowestDeviationPct: pct(lowest),
    highestDeviationPct: pct(highest),
    averageDeviationPct: pct(average),
    winningDeviationPct: pct(winning),
  };
};

export const createBid = async (payload, user, meta = {}) => {
  const { rows } = await query(
    `INSERT INTO bids
       (tender_id, company_id, amount, currency, submitted_at, status)
     VALUES ($1,$2,$3,$4,COALESCE($5, NOW()),$6)
     RETURNING id`,
    [
      payload.tenderId,
      payload.companyId,
      payload.amount,
      payload.currency ?? "INR",
      payload.submittedAt ?? null,
      payload.status ?? "submitted",
    ]
  );

  await recordAudit({
    userId: user?.id ?? null,
    action: "bid.create",
    resourceType: "bid",
    resourceId: rows[0].id,
    metadata: { tenderId: payload.tenderId, amount: payload.amount },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return getBidById(rows[0].id);
};
