import { query } from "../config/database.js";
import { httpError } from "../utils/httpError.js";
import { recordAudit } from "./audit.service.js";
import { logger } from "../utils/logger.js";

const normalizeName = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\b(pvt|private|limited|ltd|llp|inc|corp|co|company)\b\.?/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Generate candidate duplicate pairs via pg_trgm similarity on normalised names.
 * Idempotent — existing pairs are skipped.
 */
export const generateCandidates = async ({ threshold = 0.55, maxPairs = 500 } = {}) => {
  // Pull a manageable set of companies for candidate generation.
  const { rows: companies } = await query(
    `SELECT id, name, registration_id AS "registrationId" FROM companies`
  );

  // Normalise in JS so we can also store reasons.
  const normalized = companies.map((c) => ({
    id: c.id,
    name: c.name,
    registrationId: c.registrationId || "",
    normalized: normalizeName(c.name),
  }));

  // Similarity via trigram in SQL is cleanest; we leverage pg_trgm on the fly.
  const { rows: pairs } = await query(
    `WITH norm AS (
       SELECT id, name, COALESCE(registration_id,'') AS reg,
              LOWER(REGEXP_REPLACE(name, '\\m(pvt|private|limited|ltd|llp|inc|corp|co|company)\\.?\\M', '', 'gi')) AS n
       FROM companies
     )
     SELECT a.id AS a_id, b.id AS b_id,
            similarity(a.n, b.n)::numeric AS name_sim,
            CASE WHEN a.reg <> '' AND b.reg <> '' AND LOWER(a.reg) = LOWER(b.reg) THEN 1 ELSE 0 END AS reg_match
     FROM norm a
     JOIN norm b ON a.id < b.id
     WHERE similarity(a.n, b.n) >= $1
     ORDER BY name_sim DESC
     LIMIT $2`,
    [threshold, maxPairs]
  );

  if (!pairs.length) return { created: 0, total: 0 };

  let created = 0;
  for (const p of pairs) {
    const nameSim = Number(p.name_sim);
    const regMatch = Number(p.reg_match) === 1;
    const confidence = Number(
      Math.min(0.99, nameSim * 0.9 + (regMatch ? 0.15 : 0)).toFixed(4)
    );

    const reasons = {
      nameSimilarity: nameSim,
      registrationMatch: regMatch,
      normalized: {
        a: normalized.find((x) => x.id === p.a_id)?.normalized,
        b: normalized.find((x) => x.id === p.b_id)?.normalized,
      },
    };

    const { rowCount } = await query(
      `INSERT INTO entity_matches (company_a_id, company_b_id, confidence, reasons)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_a_id, company_b_id) DO NOTHING`,
      [p.a_id, p.b_id, confidence, JSON.stringify(reasons)]
    );
    created += rowCount;
  }

  logger.info("Entity resolution candidates", { generated: created, scanned: pairs.length });
  return { created, total: pairs.length };
};

export const listMatches = async ({ status = "pending", minConfidence = 0 } = {}) => {
  const where = [];
  const params = [];
  if (status) { params.push(status); where.push(`em.status = $${params.length}`); }
  if (minConfidence > 0) { params.push(minConfidence); where.push(`em.confidence >= $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT
       em.id,
       em.confidence,
       em.reasons,
       em.status,
       em.created_at AS "createdAt",
       em.reviewed_at AS "reviewedAt",
       a.id   AS "companyAId", a.name AS "companyAName", a.registration_id AS "companyARegistration",
       b.id   AS "companyBId", b.name AS "companyBName", b.registration_id AS "companyBRegistration"
     FROM entity_matches em
     JOIN companies a ON a.id = em.company_a_id
     JOIN companies b ON b.id = em.company_b_id
     ${whereSql}
     ORDER BY em.confidence DESC, em.created_at DESC
     LIMIT 200`,
    params
  );
  return rows;
};

export const decideMatch = async (id, decision, user, meta = {}) => {
  if (!["confirmed", "rejected"].includes(decision)) {
    throw httpError(400, "decision must be 'confirmed' or 'rejected'");
  }

  const { rows } = await query(
    `UPDATE entity_matches
       SET status = $1, reviewed_by = $2, reviewed_at = NOW()
     WHERE id = $3
     RETURNING id, status`,
    [decision, user?.id ?? null, id]
  );
  if (!rows.length) throw httpError(404, "Match not found");

  await recordAudit({
    userId: user?.id ?? null,
    action: `entity_match.${decision}`,
    resourceType: "entity_match",
    resourceId: id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return rows[0];
};

export const matchStats = async () => {
  const { rows } = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int   AS pending,
      COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
      COUNT(*) FILTER (WHERE status = 'rejected')::int  AS rejected
    FROM entity_matches
  `);
  return rows[0];
};
