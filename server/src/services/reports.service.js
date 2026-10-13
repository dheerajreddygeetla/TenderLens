import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

import { query } from "../config/database.js";
import { storage } from "../config/storage.js";
import { httpError } from "../utils/httpError.js";
import { recordAudit } from "./audit.service.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";
import { logger } from "../utils/logger.js";

// -----------------------------------------------------------------------------
// Data loaders
// -----------------------------------------------------------------------------

const loadTenderReportData = async (tenderId) => {
  const { rows: tenderRows } = await query(
    `SELECT t.id, t.tender_code AS "tenderCode", t.title, t.status,
            t.estimated_value AS "estimatedValue", t.currency,
            t.published_at AS "publishedAt", t.deadline_at AS "deadlineAt",
            d.name AS "departmentName",
            l.name AS "locationName", l.state AS "locationState"
     FROM tenders t
     LEFT JOIN departments d ON d.id = t.department_id
     LEFT JOIN locations l ON l.id = t.location_id
     WHERE t.id = $1`,
    [tenderId]
  );
  if (!tenderRows.length) throw httpError(404, "Tender not found");
  const tender = tenderRows[0];

  const { rows: bids } = await query(
    `SELECT b.id, c.name AS "companyName", b.amount, b.currency, b.status, b.rank,
            b.submitted_at AS "submittedAt"
     FROM bids b JOIN companies c ON c.id = b.company_id
     WHERE b.tender_id = $1
     ORDER BY b.amount ASC NULLS LAST`,
    [tenderId]
  );

  const { rows: contracts } = await query(
    `SELECT c.contract_code AS "contractCode", co.name AS "companyName",
            c.original_value AS "originalValue", c.current_value AS "currentValue",
            c.status, c.start_date AS "startDate", c.end_date AS "endDate"
     FROM contracts c LEFT JOIN companies co ON co.id = c.company_id
     WHERE c.tender_id = $1`,
    [tenderId]
  );

  const { rows: documents } = await query(
    `SELECT original_name AS "originalName", mime_type AS "mimeType",
            size_bytes AS "sizeBytes", status, created_at AS "createdAt"
     FROM documents WHERE tender_id = $1 ORDER BY created_at DESC`,
    [tenderId]
  );

  const { rows: indicators } = await query(
    `SELECT type, severity, title, explanation, model, model_version AS "modelVersion",
            created_at AS "createdAt"
     FROM review_indicators WHERE tender_id = $1
     ORDER BY created_at DESC`,
    [tenderId]
  );

  return { tender, bids, contracts, documents, indicators };
};

const loadCompanyReportData = async (companyId) => {
  const { rows: companyRows } = await query(
    `SELECT c.id, c.name, c.registration_id AS "registrationId", c.industry,
            l.name AS "locationName", l.state AS "locationState"
     FROM companies c LEFT JOIN locations l ON l.id = c.location_id
     WHERE c.id = $1`,
    [companyId]
  );
  if (!companyRows.length) throw httpError(404, "Company not found");
  const company = companyRows[0];

  const { rows: tenders } = await query(
    `SELECT t.tender_code AS "tenderCode", t.title, b.amount, b.rank, b.status AS "bidStatus",
            b.submitted_at AS "submittedAt"
     FROM bids b JOIN tenders t ON t.id = b.tender_id
     WHERE b.company_id = $1 ORDER BY b.submitted_at DESC`,
    [companyId]
  );

  const { rows: contracts } = await query(
    `SELECT c.contract_code AS "contractCode", c.original_value AS "originalValue",
            c.current_value AS "currentValue", c.status,
            c.start_date AS "startDate", c.end_date AS "endDate"
     FROM contracts c WHERE c.company_id = $1 ORDER BY c.created_at DESC`,
    [companyId]
  );

  return { company, tenders, contracts };
};

const loadAuditReportData = async (filters) => {
  const params = [];
  const where = [];
  if (filters?.action) { params.push(`%${filters.action}%`); where.push(`action ILIKE $${params.length}`); }
  if (filters?.resourceType) { params.push(filters.resourceType); where.push(`resource_type = $${params.length}`); }
  if (filters?.result) { params.push(filters.result); where.push(`result = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT al.created_at AS "createdAt",
            COALESCE(u.email,'') AS "userEmail", COALESCE(u.full_name,'') AS "userName",
            al.action, al.resource_type AS "resourceType", al.resource_id AS "resourceId",
            al.result, al.ip
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${whereSql}
     ORDER BY al.created_at DESC
     LIMIT 2000`,
    params
  );
  return rows;
};

// -----------------------------------------------------------------------------
// Generators
// -----------------------------------------------------------------------------

const writeCsv = async (rows, filePath) => {
  if (!rows.length) {
    await fs.writeFile(filePath, "\n");
    return;
  }
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  await fs.writeFile(filePath, lines.join("\n"));
};

const writeXlsx = async (sections, filePath) => {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  wb.creator = "TenderLens";

  for (const { name, rows } of sections) {
    const ws = wb.addWorksheet(name.slice(0, 31) || "Sheet");
    if (!rows || !rows.length) {
      ws.addRow(["(no data)"]);
      continue;
    }
    const headers = Object.keys(rows[0]);
    ws.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: Math.min(Math.max(h.length + 2, 14), 40),
    }));
    for (const r of rows) ws.addRow(r);
    ws.getRow(1).font = { bold: true };
  }

  await wb.xlsx.writeFile(filePath);
};

/**
 * PDF writer.
 * NOTE: `new Promise(...)` executor is NOT async. That's why we import
 * `createWriteStream` from "node:fs" at the top instead of dynamic-importing it.
 */
const writePdf = (title, sections, filePath) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const stream = doc.pipe(createWriteStream(filePath));

    stream.on("finish", () => resolve());
    stream.on("error", (e) => reject(e));

    doc.fontSize(18).fillColor("#111").text(title, { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#666").text(`Generated ${new Date().toISOString()} · TenderLens`);
    doc.fillColor("#000").moveDown(1);

    for (const section of sections) {
      doc.fontSize(13).fillColor("#111").text(section.name);
      doc.moveDown(0.3);

      if (!section.rows || !section.rows.length) {
        doc.fontSize(10).fillColor("#666").text("(no data)").fillColor("#000");
        doc.moveDown(0.8);
        continue;
      }

      const headers = Object.keys(section.rows[0]);
      for (const r of section.rows.slice(0, 200)) {
        doc.fontSize(9);
        const line = headers
          .slice(0, 6)
          .map((h) => {
            const v = r[h] === null || r[h] === undefined ? "" : String(r[h]);
            return `${h}: ${v.length > 24 ? v.slice(0, 22) + "…" : v}`;
          })
          .join("  ·  ");
        doc.fillColor("#222").text(line, { width: doc.page.width - 80 });
      }

      if (section.rows.length > 200) {
        doc.fillColor("#666").fontSize(9).text(`… +${section.rows.length - 200} more rows`);
      }
      doc.moveDown(1);
    }

    doc.end();
  });

// -----------------------------------------------------------------------------
// Public: generate
// -----------------------------------------------------------------------------

const fileExt = { pdf: "pdf", csv: "csv", xlsx: "xlsx" };
const mime = {
  pdf: "application/pdf",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export const generateReport = async ({ kind, format, resourceId, filters, user }) => {
  const { rows } = await query(
    `INSERT INTO reports (kind, format, resource_id, filename, mime_type, status, requested_by)
     VALUES ($1,$2,$3,'','', 'generating', $4)
     RETURNING id`,
    [kind, format, resourceId || null, user?.id ?? null]
  );
  const id = rows[0].id;

  try {
    let title = "TenderLens Report";
    let sections = [];

    if (kind === "tender_analysis") {
      if (!resourceId) throw httpError(400, "resourceId is required for tender reports");
      const data = await loadTenderReportData(resourceId);
      title = `Tender Analysis — ${data.tender.tenderCode}`;
      sections = [
        { name: "Tender", rows: [data.tender] },
        { name: "Bids", rows: data.bids },
        { name: "Contracts", rows: data.contracts },
        { name: "Documents", rows: data.documents },
        { name: "Review Indicators", rows: data.indicators },
      ];
    } else if (kind === "company") {
      if (!resourceId) throw httpError(400, "resourceId is required for company reports");
      const data = await loadCompanyReportData(resourceId);
      title = `Company Report — ${data.company.name}`;
      sections = [
        { name: "Company", rows: [data.company] },
        { name: "Tenders", rows: data.tenders },
        { name: "Contracts", rows: data.contracts },
      ];
    } else if (kind === "audit") {
      const rows2 = await loadAuditReportData(filters || {});
      title = "Audit Report";
      sections = [{ name: "Audit Log", rows: rows2 }];
    } else {
      throw httpError(400, `Unknown report kind: ${kind}`);
    }

    const slug = `${kind}-${Date.now()}`;
    const filename = `${slug}.${fileExt[format]}`;
    const storageKey = `reports/${slug}.${fileExt[format]}`;
    const filePath = path.join(storage.absolutePath, storageKey);

    await fs.mkdir(path.dirname(filePath), { recursive: true });

    if (format === "pdf") await writePdf(title, sections, filePath);
    else if (format === "csv") await writeCsv(sections[0].rows || [], filePath);
    else if (format === "xlsx") await writeXlsx(sections, filePath);

    const stat = await fs.stat(filePath);

    await query(
      `UPDATE reports
       SET status='ready', filename=$1, storage_key=$2, size_bytes=$3,
           mime_type=$4, finished_at=NOW()
       WHERE id=$5`,
      [filename, storageKey, stat.size, mime[format], id]
    );

    await recordAudit({
      userId: user?.id ?? null,
      action: "report.generate",
      resourceType: "report",
      resourceId: id,
      metadata: { kind, format, resourceId },
    });

    return { id, filename, storageKey, size: stat.size };
  } catch (err) {
    logger.error("Report generation failed", { id, message: err.message });
    await query(
      `UPDATE reports SET status='failed', error=$1, finished_at=NOW() WHERE id=$2`,
      [String(err.message).slice(0, 500), id]
    );
    throw err;
  }
};

// -----------------------------------------------------------------------------
// Public: list / get / delete
// -----------------------------------------------------------------------------

export const listReports = async (q) => {
  const { page, limit, offset } = parsePagination(q, { defaultLimit: 25, maxLimit: 100 });
  const where = [];
  const params = [];
  if (q.kind) { params.push(q.kind); where.push(`kind = $${params.length}`); }
  if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows: countRows } = await query(`SELECT COUNT(*)::int AS total FROM reports ${whereSql}`, params);
  const total = countRows[0].total;

  const { rows } = await query(
    `SELECT r.id, r.kind, r.format, r.resource_id AS "resourceId",
            r.filename, r.mime_type AS "mimeType", r.size_bytes AS "sizeBytes",
            r.status, r.error, r.created_at AS "createdAt", r.finished_at AS "finishedAt",
            r.requested_by AS "requestedBy",
            u.full_name AS "requestedByName"
     FROM reports r LEFT JOIN users u ON u.id = r.requested_by
     ${whereSql}
     ORDER BY r.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { items: rows, pagination: buildPagination(total, page, limit) };
};

export const getReportById = async (id) => {
  const { rows } = await query(
    `SELECT id, kind, format, resource_id AS "resourceId",
            filename, storage_key AS "storageKey", mime_type AS "mimeType",
            size_bytes AS "sizeBytes", status, error,
            created_at AS "createdAt", finished_at AS "finishedAt"
     FROM reports WHERE id = $1`,
    [id]
  );
  if (!rows.length) throw httpError(404, "Report not found");
  return rows[0];
};

export const deleteReport = async (id, user) => {
  const { rows } = await query(
    `DELETE FROM reports WHERE id = $1 RETURNING storage_key`,
    [id]
  );
  if (!rows.length) throw httpError(404, "Report not found");
  if (rows[0].storage_key) {
    try { await fs.unlink(path.join(storage.absolutePath, rows[0].storage_key)); } catch { /* ignore */ }
  }
  await recordAudit({
    userId: user?.id ?? null,
    action: "report.delete",
    resourceType: "report",
    resourceId: id,
  });
  return { ok: true };
};
