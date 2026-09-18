import {
  listTenders,
  getTenderById,
  createTender,
  updateTender,
  deleteTender,
} from "../services/tender.service.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") || null });

export const getTenders = async (req, res, next) => {
  try {
    const result = await listTenders(req.validatedQuery || req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};

export const getTender = async (req, res, next) => {
  try {
    const tender = await getTenderById(req.params.id);
    res.json({ success: true, data: tender });
  } catch (err) {
    next(err);
  }
};

export const postTender = async (req, res, next) => {
  try {
    const tender = await createTender(req.body, req.user, meta(req));
    res.status(201).json({ success: true, data: tender });
  } catch (err) {
    next(err);
  }
};

export const putTender = async (req, res, next) => {
  try {
    const tender = await updateTender(req.params.id, req.body, req.user, meta(req));
    res.json({ success: true, data: tender });
  } catch (err) {
    next(err);
  }
};

export const removeTender = async (req, res, next) => {
  try {
    const result = await deleteTender(req.params.id, req.user, meta(req));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
