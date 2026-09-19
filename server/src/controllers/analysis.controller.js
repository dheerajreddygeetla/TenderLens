import {
  runTenderAnalysis,
  getLatestRun,
  listRunsForTender,
} from "../services/analysis.service.js";
import { listBidsForTender, getBidStatsForTender } from "../services/bid.service.js";
import { listIndicators } from "../services/review.service.js";
import { getTenderById } from "../services/tender.service.js";

export const postRunAnalysis = async (req, res, next) => {
  try {
    const result = await runTenderAnalysis(req.params.tenderId, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getAnalysis = async (req, res, next) => {
  try {
    const tenderId = req.params.tenderId;
    const [tender, latestRun, bids, bidStats, indicators, runs] = await Promise.all([
      getTenderById(tenderId),
      getLatestRun(tenderId),
      listBidsForTender(tenderId),
      getBidStatsForTender(tenderId),
      listIndicators({ tenderId, limit: 50 }),
      listRunsForTender(tenderId),
    ]);

    res.json({
      success: true,
      data: {
        tender,
        latestRun,
        runs,
        bids,
        bidStats,
        indicators: indicators.items,
      },
    });
  } catch (err) { next(err); }
};
