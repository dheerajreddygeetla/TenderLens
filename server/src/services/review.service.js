import { query } from "../config/database.js";
import { httpError } from "../utils/httpError.js";
import { buildPagination, parsePagination, parseSort } from "../utils/pagination.js";
import { recordAudit } from "./audit.service.js";

export const INDICATOR_TYPES = [
  "Bid Pattern Anomaly",
  "Document Similarity",
  "Participation Anomaly",
  "Contract Modification",
  "Timeline Pattern",
  "Entity Relationship",
  "Geographic Pattern",
  "Data Quality Issue",
];

const SORT_COLUMNS = ["created_at", "severity", "status", "type"];

const SELECT_INDICATOR_BASE = `
  SELECT
    ri.id,
    ri.tender_id     AS "tenderId",
    t.tender_code    AS "tenderCode",
    t.title          AS "tenderTitle",
    ri.company_id    AS "companyId",
    co.name          AS "companyName",
    ri.document_id   AS "documentId",
    ri.analysis_run_id AS "analysisRunId",
    ri.type,
    ri.severity,
    ri.title,
    ri.evidence,
    ri.explanation,
    ri.model,
    ri.model_version AS "modelVersion",
    ri.status,
    ri.assigned_to   AS "assignedTo",
    u.full_name      AS "assignedToName",
    ri.created_at    AS "createdAt",
    ri.updated_at    AS "updatedAt",
    (SELECT COUNT(*)::int FROM review_notes rn WHERE rn.indicator_id = ri.id) AS "noteCount"
  FROM review_indicators ri
  LEFT JOIN tenders   t  ON t.id  = ri.tender_id
  LEFT JOIN companies co ON co.id = ri.company_id
  LEFT JOIN users     u  ON u.id  = ri.assigned_to
`;

export const listIndicators = async (q) => {
  const { page, limit, offset } = parsePagination(q, { defaultLimit: 25, maxLimit: 100 });
  const { sortBy, sortDir } = parseSort(q, SORT_COLUMNS, {
    column: "created_at",
    dir: "DESC",
  });

  const where = [];
  const params = [];
  const push = (sql, val) => {
    params.push(val);
    where.push(sql.replace("$?", `$${params.length}`));
  };

  if (q.severity) push("ri.severity = $?", q.severity);
  if (q.status) push("ri.status = $?", q.status);
  if (q.type) push("ri.type = $?", q.type);
  if (q.tenderId) push("ri.tender_id = $?", q.tenderId);
  if (q.companyId) push("ri.company_id = $?", q.companyId);
  if (q.assignedTo) push("ri.assigned_to = $?", q.assignedTo);
  if (q.search) {
    params.push(`%${q.search}%`);
    const p = `$${params.length}`;
    where.push(
      `(ri.title ILIKE ${p} OR COALESCE(t.tender_code,'') ILIKE ${p} OR COALESCE(co.name,'') ILIKE ${p})`
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM review_indicators ri
       LEFT JOIN tenders t   ON t.id = ri.tender_id
       LEFT JOIN companies co ON co.id = ri.company_id
       ${whereSql}`,
    params
  );
  const total = countRows[0].total;

  const { rows } = await query(
    `${SELECT_INDICATOR_BASE}
     ${whereSql}
     ORDER BY ri.${sortBy} ${sortDir} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { items: rows, pagination: buildPagination(total, page, limit) };
};

export const getIndicatorById = async (id) => {
  const { rows } = await query(`${SELECT_INDICATOR_BASE} WHERE ri.id = $1 LIMIT 1`, [id]);
  if (!rows.length) throw httpError(404, "Review indicator not found");

  const { rows: notes } = await query(
    `SELECT rn.id, rn.body, rn.author_id AS "authorId",
            u.full_name AS "authorName", rn.created_at AS "createdAt"
     FROM review_notes rn
     LEFT JOIN users u ON u.id = rn.author_id
     WHERE rn.indicator_id = $1
     ORDER BY rn.created_at ASC`,
    [id]
  );

  return { ...rows[0], notes };
};

export const createIndicator = async ({
  tenderId = null,
  companyId = null,
  documentId = null,
  analysisRunId = null,
  type,
  severity,
  title,
  evidence = null,
  explanation = null,
  model = null,
  modelVersion = null,
}) => {
  // Basic dedupe: skip if identical (type, tender, document) already exists in last 24h
  const { rows: dupes } = await query(
    `SELECT id FROM review_indicators
     WHERE type = $1
       AND COALESCE(tender_id::text,'') = COALESCE($2::text,'')
       AND COALESCE(document_id::text,'') = COALESCE($3::text,'')
       AND created_at > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [type, tenderId, documentId]
  );
  if (dupes.length) return { id: dupes[0].id, deduped: true };

  const { rows } = await query(
    `INSERT INTO review_indicators
       (tender_id, company_id, document_id, analysis_run_id,
        type, severity, title, evidence, explanation, model, model_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      tenderId,
      companyId,
      documentId,
      analysisRunId,
      type,
      severity,
      title,
      evidence ? JSON.stringify(evidence) : null,
      explanation,
      model,
      modelVersion,
    ]
  );

  return { id: rows[0].id, deduped: false };
};

export const updateIndicatorStatus = async (id, { status, assignedTo }, user, meta = {}) => {
  const allowed = ["new", "under_review", "resolved", "dismissed"];
  if (status && !allowed.includes(status)) throw httpError(400, "Invalid status");

  const sets = [];
  const params = [];
  if (status) {
    params.push(status);
    sets.push(`status = $${params.length}`);
  }
  if (assignedTo !== undefined) {
    params.push(assignedTo);
    sets.push(`assigned_to = $${params.length}`);
  }
  if (!sets.length) return getIndicatorById(id);

  params.push(id);
  const { rows } = await query(
    `UPDATE review_indicators SET ${sets.join(", ")} WHERE id = $1 RETURNING id`.replace(
      "WHERE id = $1",
      `WHERE id = $${params.length}`
    ),
    params
  );
  if (!rows.length) throw httpError(404, "Review indicator not found");

  await recordAudit({
    userId: user?.id ?? null,
    action: "review.update_status",
    resourceType: "review_indicator",
    resourceId: id,
    metadata: { status, assignedTo },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return getIndicatorById(id);
};

export const addNote = async (id, body, user) => {
  if (!body || !body.trim()) throw httpError(400, "Note body is required");

  const { rows } = await query(
    `INSERT INTO review_notes (indicator_id, author_id, body)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [id, user?.id ?? null, body.trim()]
  );

  await recordAudit({
    userId: user?.id ?? null,
    action: "review.add_note",
    resourceType: "review_indicator",
    resourceId: id,
    metadata: { noteId: rows[0].id },
  });

  return getIndicatorById(id);
};

export const summaryCounts = async () => {
  const { rows } = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE severity = 'high')::int   AS high,
      COUNT(*) FILTER (WHERE severity = 'medium')::int AS medium,
      COUNT(*) FILTER (WHERE severity = 'low')::int    AS low,
      COUNT(*) FILTER (WHERE status = 'new')::int      AS new,
      COUNT(*) FILTER (WHERE status = 'under_review')::int AS under_review,
      COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
      COUNT(*) FILTER (WHERE status = 'dismissed')::int AS dismissed
    FROM review_indicators
  `);
  return rows[0];
};
