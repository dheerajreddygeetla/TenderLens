import {
  listIndicators,
  getIndicatorById,
  updateIndicatorStatus,
  addNote,
  summaryCounts,
} from "../services/review.service.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") || null });

export const getIndicators = async (req, res, next) => {
  try {
    const result = await listIndicators(req.validatedQuery || req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (err) { next(err); }
};

export const getIndicator = async (req, res, next) => {
  try {
    const item = await getIndicatorById(req.params.id);
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

export const patchIndicatorStatus = async (req, res, next) => {
  try {
    const item = await updateIndicatorStatus(req.params.id, req.body, req.user, meta(req));
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

export const postIndicatorNote = async (req, res, next) => {
  try {
    const item = await addNote(req.params.id, req.body?.body, req.user);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

export const getSummary = async (req, res, next) => {
  try {
    const summary = await summaryCounts();
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
};
