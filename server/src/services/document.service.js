import { query } from "../config/database.js";
import { httpError } from "../utils/httpError.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";
import { storage } from "../config/storage.js";
import { recordAudit } from "./audit.service.js";
import { getDocumentQueue } from "../jobs/queue.js";
import { logger } from "../utils/logger.js";

const SELECT_DOC_BASE = `
  SELECT
    d.id,
    d.tender_id       AS "tenderId",
    t.tender_code     AS "tenderCode",
    t.title           AS "tenderTitle",
    d.original_name   AS "originalName",
    d.storage_key     AS "storageKey",
    d.mime_type       AS "mimeType",
    d.size_bytes      AS "sizeBytes",
    d.file_hash       AS "fileHash",
    d.status,
    d.uploaded_by     AS "uploadedBy",
    u.full_name       AS "uploadedByName",
    d.created_at      AS "createdAt"
  FROM documents d
  LEFT JOIN tenders t ON t.id = d.tender_id
  LEFT JOIN users   u ON u.id = d.uploaded_by
`;

export const listDocuments = async (q) => {
  const { page, limit, offset } = parsePagination(q);

  const where = [];
  const params = [];
  const push = (sql, val) => {
    params.push(val);
    where.push(sql.replace("$?", `$${params.length}`));
  };

  if (q.tenderId) push("d.tender_id = $?", q.tenderId);
  if (q.status) push("d.status = $?", q.status);
  if (q.search) {
    params.push(`%${q.search}%`);
    const p = `$${params.length}`;
    where.push(`(d.original_name ILIKE ${p} OR COALESCE(t.tender_code,'') ILIKE ${p})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM documents d ${whereSql}`,
    params
  );
  const total = countRows[0].total;

  const { rows } = await query(
    `${SELECT_DOC_BASE}
     ${whereSql}
     ORDER BY d.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { items: rows, pagination: buildPagination(total, page, limit) };
};

export const getDocumentById = async (id) => {
  const { rows } = await query(`${SELECT_DOC_BASE} WHERE d.id = $1 LIMIT 1`, [id]);
  if (!rows.length) throw httpError(404, "Document not found");
  return rows[0];
};

export const listDocumentsForTender = async (tenderId) => {
  const { rows } = await query(
    `${SELECT_DOC_BASE} WHERE d.tender_id = $1 ORDER BY d.created_at DESC`,
    [tenderId]
  );
  return rows;
};

export const getChunksForDocument = async (id) => {
  const { rows } = await query(
    `SELECT id, chunk_index AS "chunkIndex", content, char_count AS "charCount"
     FROM document_chunks WHERE document_id = $1
     ORDER BY chunk_index ASC`,
    [id]
  );
  return rows;
};

export const uploadDocument = async ({ file, tenderId, user, meta = {} }) => {
  if (!file) throw httpError(400, "No file provided");

  const { storageKey, fileHash, sizeBytes } = await storage.save({
    buffer: file.buffer,
    originalName: file.originalname,
  });

  const { rows: existing } = await query(
    `SELECT id FROM documents WHERE file_hash = $1 LIMIT 1`,
    [fileHash]
  );
  const isDuplicate = existing.length > 0;

  const { rows } = await query(
    `INSERT INTO documents
       (tender_id, original_name, storage_key, mime_type, size_bytes, file_hash, status, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,'uploaded',$7)
     RETURNING id`,
    [
      tenderId ?? null,
      file.originalname,
      storageKey,
      file.mimetype,
      sizeBytes,
      fileHash,
      user?.id ?? null,
    ]
  );

  await recordAudit({
    userId: user?.id ?? null,
    action: "document.upload",
    resourceType: "document",
    resourceId: rows[0].id,
    metadata: { originalName: file.originalname, sizeBytes, isDuplicate },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  // Enqueue background processing
  try {
    const queue = getDocumentQueue();
    await queue.add("process", { documentId: rows[0].id });
  } catch (err) {
    logger.warn("Failed to enqueue document job", { message: err.message });
  }

  const doc = await getDocumentById(rows[0].id);
  return { ...doc, isDuplicate };
};

export const deleteDocument = async (id, user, meta = {}) => {
  const { rows } = await query(
    `DELETE FROM documents WHERE id = $1 RETURNING storage_key`,
    [id]
  );
  if (!rows.length) throw httpError(404, "Document not found");

  await storage.remove(rows[0].storage_key);

  await recordAudit({
    userId: user?.id ?? null,
    action: "document.delete",
    resourceType: "document",
    resourceId: id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { ok: true };
};
