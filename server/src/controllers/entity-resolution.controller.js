import {
  generateCandidates,
  listMatches,
  decideMatch,
  matchStats,
} from "../services/entity-resolution.service.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") || null });

export const getMatches = async (req, res, next) => {
  try {
    const q = req.validatedQuery || req.query;
    const status = q.status === "all" ? null : (q.status || "pending");
    const rows = await listMatches({ status, minConfidence: q.minConfidence || 0 });
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const postGenerate = async (req, res, next) => {
  try {
    const q = req.validatedQuery || req.query;
    const result = await generateCandidates({
      threshold: q.threshold ?? 0.55,
      maxPairs: q.maxPairs ?? 500,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const patchDecide = async (req, res, next) => {
  try {
    const result = await decideMatch(req.params.id, req.body.decision, req.user, meta(req));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await matchStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};
