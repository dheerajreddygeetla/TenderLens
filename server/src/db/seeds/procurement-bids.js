import { logger } from "../../utils/logger.js";

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const seedBids = async (client, { seed = 20260201 } = {}) => {
  const rnd = mulberry32(seed);

  const { rows: tenders } = await client.query(
    `SELECT id, estimated_value, status, published_at FROM tenders`
  );
  const { rows: companies } = await client.query(`SELECT id FROM companies`);

  if (!tenders.length || !companies.length) {
    logger.warn("No tenders or companies to seed bids against");
    return;
  }

  let inserted = 0;

  for (const t of tenders) {
    // Bids exist for evaluation / awarded / completed. Open tenders may have a couple.
    let targetBids;
    if (t.status === "open") targetBids = Math.floor(rnd() * 3);
    else if (t.status === "cancelled") targetBids = Math.floor(rnd() * 2) + 1;
    else targetBids = 3 + Math.floor(rnd() * 8); // 3–10

    const estimated = Number(t.estimated_value) || 1_000_000;
    const submittedBase = t.published_at
      ? new Date(t.published_at).getTime() + 15 * 86_400_000
      : Date.now();

    // Pick distinct companies
    const used = new Set();
    let picked = 0;
    let attempts = 0;
    while (picked < targetBids && attempts < targetBids * 4) {
      attempts += 1;
      const c = companies[Math.floor(rnd() * companies.length)];
      if (used.has(c.id)) continue;
      used.add(c.id);

      // Amount: 82%–118% of estimated with a slight preference for lower values
      const factor = 0.82 + rnd() * 0.36;
      const amount = Math.max(1000, Math.round((estimated * factor) / 1000) * 1000);

      const submittedAt = new Date(submittedBase + Math.floor(rnd() * 15 * 86_400_000));

      const status =
        t.status === "awarded" || t.status === "completed" ? "submitted" : "submitted";

      const { rowCount } = await client.query(
        `INSERT INTO bids
           (tender_id, company_id, amount, currency, submitted_at, status)
         VALUES ($1,$2,$3,'INR',$4,$5)
         ON CONFLICT (tender_id, company_id) DO NOTHING`,
        [t.id, c.id, amount, submittedAt, status]
      );
      inserted += rowCount;
      picked += 1;
    }

    // Mark winning bid + assign ranks
    if (t.status === "awarded" || t.status === "completed") {
      const { rows: bidRows } = await client.query(
        `SELECT id FROM bids WHERE tender_id = $1 ORDER BY amount ASC`,
        [t.id]
      );
      if (bidRows.length) {
        // Lowest = rank 1 = winning
        for (let i = 0; i < bidRows.length; i += 1) {
          await client.query(
            `UPDATE bids SET rank = $1,
               status = CASE WHEN $1 = 1 THEN 'awarded' ELSE 'evaluated' END
             WHERE id = $2`,
            [i + 1, bidRows[i].id]
          );
        }
      }
    } else if (t.status === "evaluation") {
      const { rows: bidRows } = await client.query(
        `SELECT id FROM bids WHERE tender_id = $1 ORDER BY amount ASC`,
        [t.id]
      );
      for (let i = 0; i < bidRows.length; i += 1) {
        await client.query(`UPDATE bids SET rank = $1, status = 'evaluated' WHERE id = $2`, [
          i + 1,
          bidRows[i].id,
        ]);
      }
    }
  }

  logger.info(`Seeded bids (inserted ${inserted})`);
};
