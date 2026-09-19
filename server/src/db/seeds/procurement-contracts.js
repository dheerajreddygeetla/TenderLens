import { logger } from "../../utils/logger.js";

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pad = (n, w = 4) => String(n).padStart(w, "0");

export const seedContracts = async (client, { seed = 20260301 } = {}) => {
  const rnd = mulberry32(seed);

  const { rows: eligibleTenders } = await client.query(
    `SELECT t.id, t.tender_code, t.status, t.estimated_value, t.published_at,
            (SELECT b.company_id FROM bids b
               WHERE b.tender_id = t.id
               ORDER BY b.amount ASC LIMIT 1) AS winning_company_id,
            (SELECT b.amount FROM bids b
               WHERE b.tender_id = t.id
               ORDER BY b.amount ASC LIMIT 1) AS winning_amount
     FROM tenders t
     WHERE t.status IN ('awarded','completed')`
  );

  let contractCount = 0;
  let amendmentCount = 0;
  let i = 1;

  for (const t of eligibleTenders) {
    const value = Number(t.winning_amount) || Number(t.estimated_value) || 5_000_000;
    const code = `CT-${new Date(t.published_at || Date.now()).getFullYear()}-${pad(i, 5)}`;
    i += 1;

    const startDate = t.published_at
      ? new Date(new Date(t.published_at).getTime() + 45 * 86_400_000)
      : new Date();
    const endDate = new Date(startDate.getTime() + (180 + Math.floor(rnd() * 540)) * 86_400_000);

    const status = t.status === "completed" ? "completed" : rnd() < 0.1 ? "terminated" : "active";

    const { rows } = await client.query(
      `INSERT INTO contracts
         (contract_code, tender_id, company_id, original_value, current_value,
          currency, start_date, end_date, status)
       VALUES ($1,$2,$3,$4,$4,'INR',$5,$6,$7)
       ON CONFLICT (contract_code) DO NOTHING
       RETURNING id`,
      [
        code,
        t.id,
        t.winning_company_id,
        value,
        startDate.toISOString().slice(0, 10),
        endDate.toISOString().slice(0, 10),
        status,
      ]
    );
    if (!rows.length) continue;
    contractCount += 1;
    const contractId = rows[0].id;

    // ~28% of contracts have amendments (1–3)
    if (rnd() < 0.28) {
      const numAmendments = 1 + Math.floor(rnd() * 3);
      let currentEnd = endDate;
      for (let a = 1; a <= numAmendments; a += 1) {
        // Increase by 3%–22%, sometimes negative
        const direction = rnd() < 0.85 ? 1 : -1;
        const delta = direction * Math.round((value * (0.03 + rnd() * 0.19)) / 1000) * 1000;
        currentEnd = new Date(currentEnd.getTime() + Math.floor(rnd() * 120) * 86_400_000);

        await client.query(
          `INSERT INTO contract_amendments
             (contract_id, amendment_no, description, value_delta, new_end_date)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (contract_id, amendment_no) DO NOTHING`,
          [
            contractId,
            a,
            `Scope adjustment #${a}`,
            delta,
            currentEnd.toISOString().slice(0, 10),
          ]
        );
        amendmentCount += 1;
      }

      // Recompute current value + end date from amendments
      await client.query(
        `UPDATE contracts
           SET current_value = original_value +
                COALESCE((SELECT SUM(value_delta) FROM contract_amendments WHERE contract_id = $1), 0),
               end_date = COALESCE(
                 (SELECT MAX(new_end_date) FROM contract_amendments WHERE contract_id = $1),
                 end_date)
         WHERE id = $1`,
        [contractId]
      );
    }
  }

  logger.info(`Seeded contracts (${contractCount}) and amendments (${amendmentCount})`);
};
