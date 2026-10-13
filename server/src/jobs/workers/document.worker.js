import { Worker } from "bullmq";
import fs from "node:fs/promises";
import path from "node:path";

import { query } from "../../config/database.js";
import { storage } from "../../config/storage.js";
import { redisConnectionOptions } from "../../config/redis.js";
import { aiService } from "../../services/ai.service.js";
import { createIndicator } from "../../services/review.service.js";
import { notifyRole } from "../../services/notification.service.js";
import { QUEUE_NAMES } from "../queue.js";
import { logger } from "../../utils/logger.js";

const updateDocStatus = async (id, status) => {
  await query(`UPDATE documents SET status = $1 WHERE id = $2`, [status, id]);
};

const processDocument = async (job) => {
  const { documentId } = job.data;

  const { rows } = await query(
    `SELECT id, tender_id AS "tenderId", original_name AS "originalName",
            storage_key AS "storageKey", mime_type AS "mimeType"
     FROM documents WHERE id = $1`,
    [documentId]
  );
  if (!rows.length) {
    logger.warn("Document not found for processing", { documentId });
    return;
  }
  const doc = rows[0];

  await updateDocStatus(doc.id, "processing");

  // 1) Read file from local storage
  const filePath = path.join(storage.absolutePath, doc.storageKey);
  let buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch (err) {
    logger.error("Failed to read document from storage", { documentId, message: err.message });
    await updateDocStatus(doc.id, "failed");
    throw err;
  }

  // 2) Extract text via AI service (PDF only for now)
  let extract;
  if (doc.mimeType === "application/pdf") {
    extract = await aiService.extractPdf(buffer, doc.originalName);
  } else {
    // Non-PDF: store a single chunk placeholder so downstream similarity still works
    extract = { chunks: [`[Non-PDF document: ${doc.originalName}]`], chunk_count: 1, char_count: 40 };
  }

  // 3) Replace chunks
  await query(`DELETE FROM document_chunks WHERE document_id = $1`, [doc.id]);
  let idx = 0;
  for (const content of extract.chunks || []) {
    await query(
      `INSERT INTO document_chunks (document_id, chunk_index, content, char_count)
       VALUES ($1,$2,$3,$4)`,
      [doc.id, idx, content, content.length]
    );
    idx += 1;
  }

  await updateDocStatus(doc.id, "processed");

  // 4) Similarity across other tenders (skip if this doc has no tender)
  if (doc.tenderId) {
    await detectDocumentSimilarity(doc, extract.chunks || []);
  }

  // 5) Notify tender owner(s)
  await notifyRole("officer", {
    kind: "document.processed",
    title: `Document processed: ${doc.originalName}`,
    body: `${extract.chunk_count ?? 0} chunk(s), ${extract.char_count ?? 0} chars`,
    resourceType: "document",
    resourceId: doc.id,
  });

  logger.info("Document processed", { documentId: doc.id, chunks: idx });
};

/**
 * Compare this document's chunks against other tenders' processed documents.
 * If cosine similarity > 0.85, create a Document Similarity indicator on both tenders.
 */
const detectDocumentSimilarity = async (doc, sourceChunks) => {
  const sourceText = sourceChunks.join(" ");
  if (sourceText.length < 200) return;

  // Pull up to N recent documents from OTHER tenders
  const { rows: candidates } = await query(
    `SELECT d.id, d.tender_id AS "tenderId",
            string_agg(dc.content, ' ' ORDER BY dc.chunk_index) AS text
     FROM documents d
     JOIN document_chunks dc ON dc.document_id = d.id
     WHERE d.id <> $1
       AND d.tender_id IS NOT NULL
       AND d.tender_id <> $2
       AND d.status = 'processed'
     GROUP BY d.id, d.tender_id
     ORDER BY d.created_at DESC
     LIMIT 50`,
    [doc.id, doc.tenderId]
  );

  if (!candidates.length) return;

  const targets = candidates.map((c) => ({ id: c.id, text: (c.text || "").slice(0, 20_000) }));
  const res = await aiService.compare({ id: doc.id, text: sourceText.slice(0, 20_000) }, targets);

  const top = (res.results || []).slice(0, 5);
  const highs = top.filter((r) => r.similarity >= 0.85);

  for (const h of highs) {
    const other = candidates.find((c) => c.id === h.id);
    if (!other) continue;

    const evidence = {
      sourceDocumentId: doc.id,
      sourceDocumentName: doc.originalName,
      targetDocumentId: other.id,
      similarity: h.similarity,
      method: "TF-IDF cosine similarity",
    };
    const explanation =
      "High lexical/semantic similarity was detected between two tender documents from different tenders. This is a similarity measurement; it is not proof of any improper conduct.";

    const a = await createIndicator({
      tenderId: doc.tenderId,
      documentId: doc.id,
      type: "Document Similarity",
      severity: h.similarity >= 0.95 ? "high" : "medium",
      title: `Tender document similar to another tender (${(h.similarity * 100).toFixed(1)}%)`,
      evidence,
      explanation,
      model: "tfidf_cosine",
      modelVersion: "1.0",
    });

    const b = await createIndicator({
      tenderId: other.tenderId,
      documentId: other.id,
      type: "Document Similarity",
      severity: h.similarity >= 0.95 ? "high" : "medium",
      title: `Tender document similar to another tender (${(h.similarity * 100).toFixed(1)}%)`,
      evidence,
      explanation,
      model: "tfidf_cosine",
      modelVersion: "1.0",
    });

    if (!a.deduped || !b.deduped) {
      await notifyRole("auditor", {
        kind: "risk.created",
        title: "Document similarity indicator created",
        body: `Similarity ${(h.similarity * 100).toFixed(1)}% across two tenders.`,
        resourceType: "review_indicator",
        resourceId: a.id,
      });
    }
  }
};

export const startDocumentWorker = () => {
  const worker = new Worker(QUEUE_NAMES.DOCUMENT_PROCESS, processDocument, {
    connection: redisConnectionOptions(),
    concurrency: 3,
  });

  worker.on("completed", (job) => logger.info("Job completed", { id: job.id, name: job.name }));
  worker.on("failed", (job, err) =>
    logger.warn("Job failed", { id: job?.id, name: job?.name, message: err.message })
  );

  return worker;
};
