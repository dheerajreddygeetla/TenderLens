import { query } from "../config/database.js";
import { httpError } from "../utils/httpError.js";
import { aiService } from "./ai.service.js";
import { createIndicator } from "./review.service.js";
import { notifyRole } from "./notification.service.js";
import { getBidStatsForTender } from "./bid.service.js";
import { logger } from "../utils/logger.js";

const SEVERITY_BY_Z = (z) => (Math.abs(z) >= 3 ? "high" : Math.abs(z) >= 2 ? "medium" : "low");

/**
 * Gather the feature vector for a tender, along with peer tenders from the same department.
 */
const buildFeatureSet = async (tenderId) => {
  const { rows: tenderRows } = await query(
    `SELECT id, department_id AS "departmentId",
            estimated_value AS "estimatedValue",
            published_at AS "publishedAt",
            deadline_at AS "deadlineAt"
     FROM tenders WHERE id = $1`,
    [tenderId]
  );
  if (!tenderRows.length) throw httpError(404, "Tender not found");
  const tender = tenderRows[0];

  const bidStats = await getBidStatsForTender(tenderId);

  const { rows: spreadRows } = await query(
    `SELECT COALESCE(STDDEV_POP(amount), 0)::numeric AS std_amount
     FROM bids WHERE tender_id = $1`,
    [tenderId]
  );

  const { rows: amendRows } = await query(
    `SELECT COUNT(*)::int AS n, COALESCE(SUM(value_delta),0)::numeric AS total_delta
     FROM contract_amendments ca
     JOIN contracts c ON c.id = ca.contract_id
     WHERE c.tender_id = $1`,
    [tenderId]
  );

  const { rows: contractRows } = await query(
    `SELECT
       COALESCE(SUM(original_value),0)::numeric AS original,
       COALESCE(SUM(current_value),0)::numeric AS current
     FROM contracts WHERE tender_id = $1`,
    [tenderId]
  );

  const estimated = Number(bidStats.estimatedValue) || 0;
  const stdAmount = Number(spreadRows[0].std_amount) || 0;
  const spreadPct = estimated > 0 ? (stdAmount / estimated) * 100 : 0;

  const original = Number(contractRows[0].original) || 0;
  const current = Number(contractRows[0].current) || 0;
  const contractChangePct = original > 0 ? ((current - original) / original) * 100 : 0;

  const durationDays =
    tender.publishedAt && tender.deadlineAt
      ? Math.round(
          (new Date(tender.deadlineAt).getTime() - new Date(tender.publishedAt).getTime()) /
            86_400_000
        )
      : 0;

  const features = {
    bidder_count: bidStats.bidCount || 0,
    average_deviation_pct: Number(bidStats.averageDeviationPct) || 0,
    spread_deviation_pct: Number(spreadPct.toFixed(2)),
    duration_days: durationDays,
    amendment_count: amendRows[0].n || 0,
    contract_change_pct: Number(contractChangePct.toFixed(2)),
  };

  return { tender, features, bidStats };
};

const loadPeers = async (departmentId, excludeTenderId) => {
  const { rows: peers } = await query(
    `SELECT
       t.id,
       (SELECT COUNT(*)::int FROM bids b WHERE b.tender_id = t.id) AS bidder_count,
       COALESCE(
         (SELECT AVG(((b.amount - t.estimated_value) / NULLIF(t.estimated_value,0)) * 100)
          FROM bids b WHERE b.tender_id = t.id), 0
       )::numeric AS average_deviation_pct,
       COALESCE(
         (SELECT STDDEV_POP(b.amount) / NULLIF(t.estimated_value,0) * 100
          FROM bids b WHERE b.tender_id = t.id), 0
       )::numeric AS spread_deviation_pct,
       GREATEST(
         0,
         EXTRACT(EPOCH FROM (t.deadline_at - t.published_at)) / 86400
       )::numeric AS duration_days,
       (SELECT COUNT(*)::int
          FROM contract_amendments ca
          JOIN contracts c ON c.id = ca.contract_id
          WHERE c.tender_id = t.id) AS amendment_count,
       COALESCE(
         (SELECT
            CASE WHEN SUM(c.original_value) > 0
                 THEN ((SUM(c.current_value) - SUM(c.original_value)) / SUM(c.original_value)) * 100
                 ELSE 0 END
          FROM contracts c WHERE c.tender_id = t.id), 0
       )::numeric AS contract_change_pct
     FROM tenders t
     WHERE t.department_id = $1 AND t.id <> $2`,
    [departmentId, excludeTenderId]
  );

  return peers.map((p) => ({
    bidder_count: Number(p.bidder_count) || 0,
    average_deviation_pct: Number(p.average_deviation_pct) || 0,
    spread_deviation_pct: Number(p.spread_deviation_pct) || 0,
    duration_days: Number(p.duration_days) || 0,
    amendment_count: Number(p.amendment_count) || 0,
    contract_change_pct: Number(p.contract_change_pct) || 0,
  }));
};

/**
 * Create rule-based indicators alongside the ML output.
 * These are stated as observations, never accusations.
 */
const applyRuleBasedIndicators = async (runId, tender, features, _bidStats) => {
  const created = [];

  // ---- Participation ----
  const { rows: peerBidderRows } = await query(
    `SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bidder_count) AS median_bidders,
            COUNT(*)::int AS comparable
     FROM (
       SELECT t.id,
              (SELECT COUNT(*) FROM bids b WHERE b.tender_id = t.id) AS bidder_count
       FROM tenders t
       WHERE t.department_id = $1
     ) x`,
    [tender.departmentId]
  );
  const median = Number(peerBidderRows[0].median_bidders) || 0;
  const comparable = peerBidderRows[0].comparable || 0;

  if (comparable >= 5 && median > 0 && features.bidder_count < median * 0.5) {
    const severity = features.bidder_count <= 1 ? "high" : "medium";
    const r = await createIndicator({
      tenderId: tender.id,
      analysisRunId: runId,
      type: "Participation Anomaly",
      severity,
      title: "Unusually low bidder participation",
      evidence: {
        currentBidders: features.bidder_count,
        medianBidders: median,
        comparableTenders: comparable,
        department: tender.departmentId,
      },
      explanation:
        "This tender has fewer bidders than the median for comparable tenders in the same department. This is a statistical observation and may warrant additional review.",
      model: "percentile_rule_v1",
      modelVersion: "1.0",
    });
    if (!r.deduped) created.push(r.id);
  }

  // ---- Bid spread ----
  if (features.bidder_count >= 3 && features.spread_deviation_pct > 0 && features.spread_deviation_pct < 2) {
    const r = await createIndicator({
      tenderId: tender.id,
      analysisRunId: runId,
      type: "Bid Pattern Anomaly",
      severity: "medium",
      title: "Very narrow spread between bid amounts",
      evidence: {
        bidders: features.bidder_count,
        spreadPct: features.spread_deviation_pct,
        averageDeviationPct: features.average_deviation_pct,
      },
      explanation:
        "Submitted bids are clustered within a very narrow range relative to the estimated value. The system flags this as a statistical pattern; it does not imply improper conduct.",
      model: "spread_rule_v1",
      modelVersion: "1.0",
    });
    if (!r.deduped) created.push(r.id);
  }

  // ---- Timeline ----
  if (features.duration_days > 0 && features.duration_days < 7) {
    const r = await createIndicator({
      tenderId: tender.id,
      analysisRunId: runId,
      type: "Timeline Pattern",
      severity: "low",
      title: "Short publish-to-deadline window",
      evidence: { durationDays: features.duration_days },
      explanation:
        "The window between publication and bid submission deadline is shorter than usual. This is a timing observation for reviewer attention.",
      model: "timeline_rule_v1",
      modelVersion: "1.0",
    });
    if (!r.deduped) created.push(r.id);
  }

  // ---- Contract modification ----
  if (features.contract_change_pct >= 15) {
    const r = await createIndicator({
      tenderId: tender.id,
      analysisRunId: runId,
      type: "Contract Modification",
      severity: features.contract_change_pct >= 40 ? "high" : "medium",
      title: "Contract value increased significantly",
      evidence: {
        changePct: features.contract_change_pct,
        amendmentCount: features.amendment_count,
      },
      explanation:
        "The cumulative current value of contracts for this tender is significantly higher than the original contract value. This is a factual change indicator.",
      model: "contract_delta_rule_v1",
      modelVersion: "1.0",
    });
    if (!r.deduped) created.push(r.id);
  }

  return created;
};

export const runTenderAnalysis = async (tenderId, user) => {
  const { tender, features, bidStats } = await buildFeatureSet(tenderId);

  const { rows: runRows } = await query(
    `INSERT INTO analysis_runs (tender_id, run_by, status, model_name, model_version, features)
     VALUES ($1,$2,'running','IsolationForest+Rules','1.0',$3)
     RETURNING id`,
    [tenderId, user?.id ?? null, JSON.stringify(features)]
  );
  const runId = runRows[0].id;

  try {
    const peers = await loadPeers(tender.departmentId, tenderId);
    const ml = await aiService.detectAnomaly(features, peers);

    const createdIds = [];

    if (ml?.is_anomaly) {
      const topFeature = ml.top_features?.[0];
      const r = await createIndicator({
        tenderId,
        analysisRunId: runId,
        type: "Bid Pattern Anomaly",
        severity: SEVERITY_BY_Z(topFeature?.z_score ?? 2),
        title: "Unusual combination of procurement features",
        evidence: {
          model: ml.model,
          modelVersion: ml.model_version,
          score: ml.score,
          features,
          topFeatures: ml.top_features,
        },
        explanation:
          "The ML model flagged this tender as a statistical outlier compared to peer tenders in the same department. This is a pattern indicator, not a determination of wrongdoing.",
        model: ml.model,
        modelVersion: ml.model_version,
      });
      if (!r.deduped) createdIds.push(r.id);
    }

    const ruleIds = await applyRuleBasedIndicators(runId, tender, features, bidStats);
    createdIds.push(...ruleIds);

    await query(
      `UPDATE analysis_runs
         SET status = 'completed',
             summary = $1,
             finished_at = NOW()
       WHERE id = $2`,
      [
        JSON.stringify({
          indicatorCount: createdIds.length,
          bidStats: {
            bidderCount: bidStats.bidCount,
            lowestBid: bidStats.lowestBid,
            highestBid: bidStats.highestBid,
            averageBid: bidStats.averageBid,
            winningBid: bidStats.winningBid,
          },
          ml,
        }),
        runId,
      ]
    );

    // Notify officers/admins
    if (createdIds.length) {
      await notifyRole("admin", {
        kind: "analysis.completed",
        title: `Tender analysis produced ${createdIds.length} review indicator(s)`,
        body: `Tender ${tender.id} analysis finished.`,
        resourceType: "tender",
        resourceId: tender.id,
      });
    }

    return { runId, indicatorIds: createdIds, features, ml };
  } catch (err) {
    logger.error("Analysis failed", { tenderId, message: err.message });
    await query(
      `UPDATE analysis_runs SET status='failed', error=$1, finished_at=NOW() WHERE id=$2`,
      [String(err.message).slice(0, 500), runId]
    );
    throw err;
  }
};

export const getLatestRun = async (tenderId) => {
  const { rows } = await query(
    `SELECT id, status, model_name AS "modelName", model_version AS "modelVersion",
            features, summary, error,
            started_at AS "startedAt", finished_at AS "finishedAt"
     FROM analysis_runs
     WHERE tender_id = $1
     ORDER BY started_at DESC
     LIMIT 1`,
    [tenderId]
  );
  return rows[0] || null;
};

export const listRunsForTender = async (tenderId) => {
  const { rows } = await query(
    `SELECT id, status, started_at AS "startedAt", finished_at AS "finishedAt",
            (summary->>'indicatorCount')::int AS "indicatorCount"
     FROM analysis_runs
     WHERE tender_id = $1
     ORDER BY started_at DESC
     LIMIT 20`,
    [tenderId]
  );
  return rows;
};
