import path from "node:path";
import fs from "node:fs";
import {
  generateReport,
  listReports,
  getReportById,
  deleteReport,
} from "../services/reports.service.js";
import { storage } from "../config/storage.js";
import { httpError } from "../utils/httpError.js";

export const postGenerate = async (req, res, next) => {
  try {
    const result = await generateReport({ ...req.body, user: req.user });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getReports = async (req, res, next) => {
  try {
    const result = await listReports(req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (err) { next(err); }
};

export const getReport = async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id);
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
};

export const downloadReport = async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id);
    if (report.status !== "ready" || !report.storageKey) {
      throw httpError(400, "Report is not ready for download");
    }
    const abs = path.join(storage.absolutePath, report.storageKey);
    if (!fs.existsSync(abs)) throw httpError(404, "Report file not found on disk");

    res.setHeader("Content-Type", report.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
    res.sendFile(abs);
  } catch (err) { next(err); }
};

export const removeReport = async (req, res, next) => {
  try {
    const result = await deleteReport(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
