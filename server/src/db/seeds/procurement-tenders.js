import { logger } from "../../utils/logger.js";
import { PROJECT_THEMES } from "./procurement-base.js";

/**
 * Deterministic pseudo-random generator so seeds are repeatable across runs.
 */
const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

const STATUSES = ["open", "evaluation", "awarded", "completed", "cancelled"];
const STATUS_WEIGHTS = [0.35, 0.15, 0.25, 0.2, 0.05]; // sums to 1.0

const weightedStatus = (rnd) => {
  const r = rnd();
  let acc = 0;
  for (let i = 0; i < STATUSES.length; i += 1) {
    acc += STATUS_WEIGHTS[i];
    if (r <= acc) return STATUSES[i];
  }
  return STATUSES[0];
};

export const seedTenders = async (client, { count = 120, createdBy = null } = {}) => {
  const rnd = mulberry32(20260101);

  const { rows: deptRows } = await client.query("SELECT id, code FROM departments");
  const { rows: locRows } = await client.query("SELECT id, name, state FROM locations");
  const { rows: projRows } = await client.query("SELECT id, code, name FROM projects");

  const depts = deptRows;
  const locs = locRows;
  const projs = projRows;

  const now = Date.now();
  const day = 86_400_000;
  let inserted = 0;

  for (let i = 1; i <= count; i += 1) {
    const dept = pick(rnd, depts);
    const loc = pick(rnd, locs);
    const proj = pick(rnd, projs);
    const theme = pick(rnd, PROJECT_THEMES);

    const year = 2024 + Math.floor(rnd() * 3); // 2024–2026
    const tenderCode = `${dept.code}-${year}-${String(i).padStart(4, "0")}`;

    // Value between 5L and 80 Cr
    const value = Math.round((500_000 + rnd() * 799_500_000) / 10_000) * 10_000;

    const status = weightedStatus(rnd);

    // Publish window: last 3 years back from "now"
    const publishedOffsetDays = Math.floor(rnd() * 3 * 365);
    const publishedAt = new Date(now - publishedOffsetDays * day);
    const deadlineAt = new Date(publishedAt.getTime() + (14 + Math.floor(rnd() * 60)) * day);

    const title = `${theme.suffix} — ${loc.name} (${proj.name})`;
    const description = `Synthetic demo tender for ${theme.suffix} under ${dept.code} in ${loc.name}, ${loc.state}. Project reference: ${proj.name}.`;

    const { rowCount } = await client.query(
      `INSERT INTO tenders
        (tender_code, title, description, department_id, location_id, project_id,
         estimated_value, currency, status, published_at, deadline_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'INR',$8,$9,$10,$11)
       ON CONFLICT (tender_code) DO NOTHING`,
      [
        tenderCode,
        title,
        description,
        dept.id,
        loc.id,
        proj.id,
        value,
        status,
        publishedAt,
        deadlineAt,
        createdBy,
      ]
    );
    inserted += rowCount;
  }

  logger.info(`Seeded tenders (attempted ${count}, inserted ${inserted})`);
};

export const TENDER_STATUSES = STATUSES;
