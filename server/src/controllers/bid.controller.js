import {
  listBids,
  getBidById,
  listBidsForTender,
  getBidStatsForTender,
  createBid,
} from "../services/bid.service.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") || null });

export const getBids = async (req, res, next) => {
  try {
    const result = await listBids(req.validatedQuery || req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (err) { next(err); }
};

export const getBid = async (req, res, next) => {
  try {
    const bid = await getBidById(req.params.id);
    res.json({ success: true, data: bid });
  } catch (err) { next(err); }
};

export const getBidsForTender = async (req, res, next) => {
  try {
    const bids = await listBidsForTender(req.params.tenderId);
    res.json({ success: true, data: bids });
  } catch (err) { next(err); }
};

export const getTenderBidStats = async (req, res, next) => {
  try {
    const stats = await getBidStatsForTender(req.params.tenderId);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

export const postBid = async (req, res, next) => {
  try {
    const bid = await createBid(req.body, req.user, meta(req));
    res.status(201).json({ success: true, data: bid });
  } catch (err) { next(err); }
};
