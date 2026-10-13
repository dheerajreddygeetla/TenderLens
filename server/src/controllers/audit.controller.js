import { listAuditLogs } from "../services/audit.service.js";

export const getAuditLogs = async (req, res, next) => {
  try {
    const result = await listAuditLogs(req.validatedQuery || req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (err) { next(err); }
};
