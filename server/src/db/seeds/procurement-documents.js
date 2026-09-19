import crypto from "node:crypto";
import { logger } from "../../utils/logger.js";

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const DOC_TYPES = [
  { suffix: "TenderNotice.pdf", mime: "application/pdf" },
  { suffix: "ScopeOfWork.pdf", mime: "application/pdf" },
  { suffix: "BoQ.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { suffix: "EligibilityCriteria.pdf", mime: "application/pdf" },
  { suffix: "TechnicalSpecs.pdf", mime: "application/pdf" },
];

export const seedDocuments = async (client, { adminId = null, seed = 20260401 } = {}) => {
  const rnd = mulberry32(seed);
  const { rows: tenders } = await client.query(`SELECT id, tender_code FROM tenders`);

  let inserted = 0;

  for (const t of tenders) {
    const numDocs = 1 + Math.floor(rnd() * 4); // 1–4
    for (let d = 0; d < numDocs; d += 1) {
      const type = DOC_TYPES[Math.floor(rnd() * DOC_TYPES.length)];
      const originalName = `${t.tender_code}-${type.suffix}`;
      const fileHash = crypto.randomBytes(32).toString("hex");
      const storageKey = `documents/seed/${fileHash.slice(0, 20)}-${type.suffix.toLowerCase()}`;
      const sizeBytes = 80_000 + Math.floor(rnd() * 4_000_000);
      const status = rnd() < 0.85 ? "processed" : rnd() < 0.6 ? "processing" : "uploaded";
      const createdAt = new Date(Date.now() - Math.floor(rnd() * 60 * 86_400_000));

      const { rowCount } = await client.query(
        `INSERT INTO documents
           (tender_id, original_name, storage_key, mime_type, size_bytes,
            file_hash, status, uploaded_by, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (storage_key) DO NOTHING`,
        [
          t.id,
          originalName,
          storageKey,
          type.mime,
          sizeBytes,
          fileHash,
          status,
          adminId,
          createdAt,
        ]
      );
      inserted += rowCount;
    }
  }

  logger.info(`Seeded documents (inserted ${inserted})`);
};
