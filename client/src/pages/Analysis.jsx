import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { analysisApi } from "../services/analysis.js";
import ExplainablePanel from "../components/ExplainablePanel.jsx";
import DocumentSimilarityList from "../components/DocumentSimilarityList.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatCurrency, formatDateTime } from "../utils/format.js";
import { useAuth } from "../hooks/useAuth.js";
import {
  BrainCircuit,
  Play,
  ArrowLeft,
  Building2,
  MapPin,
  Coins,
  Activity,
  Layers,
  Sparkles,
  History,
  CheckCircle2,
} from "lucide-react";

const pct = (v) => (v === null || v === undefined ? "—" : `${Number(v).toFixed(2)}%`);

export default function Analysis() {
  const { tenderId: routeId } = useParams();
  const { user } = useAuth();

  const [tenderId, setTenderId] = useState(routeId || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await analysisApi.get(id);
      setData(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Failed to load neural analysis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeId) {
      setTenderId(routeId);
      load(routeId);
    }
  }, [routeId, load]);

  const runAnalysis = async () => {
    if (!tenderId) return;
    setRunning(true);
    setError("");
    setNotice("");
    try {
      const res = await analysisApi.run(tenderId);
      const n = res.data?.data?.indicatorIds?.length || 0;
      setNotice(`Inference complete: ${n} anomaly indicator(s) identified.`);
      await load(tenderId);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Inference failed");
    } finally {
      setRunning(false);
    }
  };

  const canRun = user?.permissions?.includes("analysis:run");

  if (!routeId) {
    return (
      <div>
        <div className="tl-page-header">
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontFamily: "var(--tl-font-mono)",
                color: "#38bdf8",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              <BrainCircuit size={14} />
              <span>AI COLLUSION &amp; FRAUD DETECTION ENGINE</span>
            </div>
            <h1 className="tl-page-title">Neural Tender Analysis</h1>
            <p className="tl-page-sub">
              Specify a tender UUID to run statistical anomaly detection, Benford analysis, and
              NLP text similarity.
            </p>
          </div>
        </div>
        <div className="tl-card" style={{ maxWidth: 640 }}>
          <label className="tl-label">Target Tender UUID</label>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <input
              value={tenderId}
              onChange={(e) => setTenderId(e.target.value)}
              placeholder="e.g. 00000000-0000-0000-0000-000000000000"
              className="tl-input-like"
              style={{ flex: 1 }}
            />
            <button
              className="tl-btn"
              style={{ width: "auto" }}
              onClick={() => load(tenderId)}
            >
              Load Dossier
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--tl-text-muted)", marginTop: 14 }}>
            Direct access tip: Open any tender dossier in{" "}
            <Link to="/tenders" style={{ fontWeight: 600 }}>
              Tender Registry
            </Link>{" "}
            and click "Run AI Analysis".
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <p className="tl-page-sub" style={{ marginBottom: 6 }}>
            <Link
              to="/tenders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Registry</span>
            </Link>
          </p>
          <h1 className="tl-page-title">
            Neural Analysis {data?.tender?.tenderCode ? `· ${data.tender.tenderCode}` : ""}
          </h1>
          {data?.tender?.title && (
            <p className="tl-page-sub" style={{ fontSize: 14, fontWeight: 500 }}>
              {data.tender.title}
            </p>
          )}
        </div>
        {canRun && (
          <button
            className="tl-btn"
            style={{ width: "auto" }}
            onClick={runAnalysis}
            disabled={running}
          >
            <Play size={16} />
            <span>{running ? "Executing Neural Models…" : "Run Neural Analysis"}</span>
          </button>
        )}
      </div>

      {error && <div className="tl-error-bar">{error}</div>}
      {notice && (
        <div
          className="tl-card"
          style={{
            marginBottom: 16,
            borderColor: "rgba(16, 185, 129, 0.4)",
            background: "rgba(16, 185, 129, 0.08)",
            color: "#6ee7b7",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {loading && <div className="tl-loading">Fetching deep audit telemetry…</div>}

      {data && (
        <>
          {/* Metadata Card */}
          <div className="tl-card" style={{ marginBottom: 20 }}>
            <div className="tl-grid tl-grid-cols-4">
              <Info
                icon={<Building2 size={14} />}
                label="Department"
                value={data.tender.departmentName || "—"}
              />
              <Info
                icon={<MapPin size={14} />}
                label="Jurisdiction"
                value={data.tender.locationName || "—"}
              />
              <Info
                icon={<Coins size={14} />}
                label="Estimated Value"
                value={formatCurrency(data.tender.estimatedValue, data.tender.currency)}
              />
              <Info
                icon={<Activity size={14} />}
                label="Registry Status"
                value={<StatusBadge status={data.tender.status} />}
              />
            </div>
          </div>

          {/* Neural Run Summary */}
          <div className="tl-card" style={{ marginBottom: 20 }}>
            <h2 className="tl-card-title">
              <BrainCircuit size={17} color="#38bdf8" />
              <span>Inference Telemetry &amp; Bid Variance</span>
            </h2>
            {data.latestRun ? (
              <div className="tl-grid tl-grid-cols-4">
                <Info label="Run Status" value={data.latestRun.status} />
                <Info label="Active Model" value={data.latestRun.modelName || "Standard AI Heuristics"} />
                <Info label="Inference Timestamp" value={formatDateTime(data.latestRun.startedAt)} />
                <Info label="Duration" value={formatDateTime(data.latestRun.finishedAt)} />
                <Info label="Bid Count" value={data.bidStats?.bidCount ?? 0} />
                <Info
                  label="Lowest Bid"
                  value={formatCurrency(data.bidStats?.lowestBid, data.tender.currency)}
                />
                <Info
                  label="Average Bid"
                  value={formatCurrency(data.bidStats?.averageBid, data.tender.currency)}
                />
                <Info
                  label="Highest Bid"
                  value={formatCurrency(data.bidStats?.highestBid, data.tender.currency)}
                />
                <Info
                  label="Awarded Bid"
                  value={formatCurrency(data.bidStats?.winningBid, data.tender.currency)}
                />
                <Info label="Avg Deviation" value={pct(data.bidStats?.averageDeviationPct)} />
                <Info label="Lowest Deviation" value={pct(data.bidStats?.lowestDeviationPct)} />
                <Info label="Highest Deviation" value={pct(data.bidStats?.highestDeviationPct)} />
              </div>
            ) : (
              <div className="tl-empty">
                No neural inference recorded yet. Click “Run Neural Analysis” to scan this tender.
              </div>
            )}
          </div>

          {/* Explainable Indicators */}
          <div className="tl-card" style={{ marginBottom: 20 }}>
            <h2 className="tl-card-title">
              <Sparkles size={17} color="#f59e0b" />
              <span>Explainable AI Risk Indicators ({data.indicators?.length || 0})</span>
            </h2>
            {data.indicators?.length === 0 ? (
              <div className="tl-empty">No suspicious collusion patterns flagged for this tender.</div>
            ) : (
              data.indicators.map((i) => <ExplainablePanel key={i.id} indicator={i} />)
            )}
          </div>

          {/* Document Similarity */}
          <div className="tl-card" style={{ marginBottom: 20 }}>
            <h2 className="tl-card-title">
              <Layers size={17} color="#a78bfa" />
              <span>Cross-Tender Text Similarity Analysis</span>
            </h2>
            <DocumentSimilarityList indicators={data.indicators || []} />
          </div>

          {/* Bids Table */}
          <div className="tl-card" style={{ marginBottom: 20 }}>
            <h2 className="tl-card-title">
              <Coins size={17} color="#34d399" />
              <span>Bids &amp; Submitted Pricing Dossier</span>
            </h2>
            <div className="tl-table-wrap">
              <table className="tl-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Contractor Entity</th>
                    <th>Amount</th>
                    <th>Deviation from Est.</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!data.bids || data.bids.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="tl-empty">No bids recorded for this tender.</div>
                      </td>
                    </tr>
                  ) : (
                    data.bids.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 700, fontFamily: "var(--tl-font-mono)" }}>
                          #{b.rank ?? "—"}
                        </td>
                        <td style={{ fontWeight: 600 }}>{b.companyName}</td>
                        <td style={{ fontWeight: 700 }}>
                          {formatCurrency(b.amount, b.currency)}
                        </td>
                        <td style={{ color: b.deviationPct > 0 ? "#f87171" : "#34d399" }}>
                          {b.deviationPct !== null ? `${b.deviationPct}%` : "—"}
                        </td>
                        <td style={{ color: "var(--tl-text-muted)" }}>
                          {formatDateTime(b.submittedAt)}
                        </td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Runs history */}
          {data.runs?.length > 1 && (
            <div className="tl-card">
              <h2 className="tl-card-title">
                <History size={17} color="var(--tl-text-muted)" />
                <span>Historical Inference Audits</span>
              </h2>
              <div className="tl-table-wrap">
                <table className="tl-table">
                  <thead>
                    <tr>
                      <th>Started</th>
                      <th>Status</th>
                      <th>Flags Identified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.runs.map((r) => (
                      <tr key={r.id}>
                        <td>{formatDateTime(r.startedAt)}</td>
                        <td>{r.status}</td>
                        <td>
                          <strong>{r.indicatorCount ?? "—"}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color: "var(--tl-text-dim)",
          fontWeight: 700,
          fontFamily: "var(--tl-font-mono)",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 14.5, marginTop: 4, fontWeight: 600, color: "var(--tl-text-primary)" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}
