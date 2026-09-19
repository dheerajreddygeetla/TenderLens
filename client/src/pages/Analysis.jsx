import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { analysisApi } from "../services/analysis.js";
import ExplainablePanel from "../components/ExplainablePanel.jsx";
import DocumentSimilarityList from "../components/DocumentSimilarityList.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatCurrency, formatDateTime } from "../utils/format.js";
import { useAuth } from "../hooks/useAuth.js";

const pct = (v) => (v === null || v === undefined ? "—" : `${Number(v).toFixed(2)}%`);

export default function Analysis() {
  const { tenderId: routeId } = useParams();
  // Allow entry from /analysis (no id) — show a picker prompting the user to open a tender
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
      setError(err?.response?.data?.error?.message || "Failed to load analysis");
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
      setNotice(`Analysis complete. ${n} new indicator(s) created.`);
      await load(tenderId);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Analysis failed");
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
            <h1 className="tl-page-title">Tender Analysis</h1>
            <p className="tl-page-sub">Open a tender and choose “Run AI Analysis”, or paste a tender id below.</p>
          </div>
        </div>
        <div className="tl-card">
          <label style={{ fontSize: 12, color: "#475569" }}>Tender UUID</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              value={tenderId}
              onChange={(e) => setTenderId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }}
            />
            <button className="tl-btn" style={{ width: "auto" }} onClick={() => load(tenderId)}>Load</button>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
            Tip: navigate to <Link to="/tenders">Tenders</Link> and click a tender’s AI Analysis action.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <p className="tl-page-sub" style={{ marginBottom: 2 }}>
            <Link to="/tenders">← Back to Tenders</Link>
          </p>
          <h1 className="tl-page-title">
            Tender Analysis {data?.tender?.tenderCode ? `· ${data.tender.tenderCode}` : ""}
          </h1>
          {data?.tender?.title && <p className="tl-page-sub">{data.tender.title}</p>}
        </div>
        {canRun && (
          <button className="tl-btn" style={{ width: "auto" }} onClick={runAnalysis} disabled={running}>
            {running ? "Running…" : "Run AI Analysis"}
          </button>
        )}
      </div>

      {error && <div className="tl-error-bar">{error}</div>}
      {notice && <div className="tl-card" style={{ marginBottom: 12, borderColor: "#86efac", background: "#f0fdf4", color: "#166534", fontSize: 13 }}>{notice}</div>}

      {loading && <div className="tl-loading">Loading analysis…</div>}

      {data && (
        <>
          <div className="tl-card" style={{ marginBottom: 16 }}>
            <div className="tl-grid tl-grid-cols-4">
              <Info label="Department" value={data.tender.departmentName || "—"} />
              <Info label="Location" value={data.tender.locationName || "—"} />
              <Info label="Estimated Value" value={formatCurrency(data.tender.estimatedValue, data.tender.currency)} />
              <Info label="Status" value={<StatusBadge status={data.tender.status} />} />
            </div>
          </div>

          {/* Summary banner */}
          <div className="tl-card" style={{ marginBottom: 16 }}>
            <h2 className="tl-card-title">Analysis Summary</h2>
            {data.latestRun ? (
              <div className="tl-grid tl-grid-cols-4">
                <Info label="Run status" value={data.latestRun.status} />
                <Info label="Model" value={data.latestRun.modelName || "—"} />
                <Info label="Started" value={formatDateTime(data.latestRun.startedAt)} />
                <Info label="Finished" value={formatDateTime(data.latestRun.finishedAt)} />
                <Info label="Bidders" value={data.bidStats?.bidCount ?? 0} />
                <Info label="Lowest bid" value={formatCurrency(data.bidStats?.lowestBid, data.tender.currency)} />
                <Info label="Average bid" value={formatCurrency(data.bidStats?.averageBid, data.tender.currency)} />
                <Info label="Highest bid" value={formatCurrency(data.bidStats?.highestBid, data.tender.currency)} />
                <Info label="Winning bid" value={formatCurrency(data.bidStats?.winningBid, data.tender.currency)} />
                <Info label="Avg deviation" value={pct(data.bidStats?.averageDeviationPct)} />
                <Info label="Lowest dev." value={pct(data.bidStats?.lowestDeviationPct)} />
                <Info label="Highest dev." value={pct(data.bidStats?.highestDeviationPct)} />
              </div>
            ) : (
              <div className="tl-empty">No analysis run yet. Click “Run AI Analysis” to generate indicators.</div>
            )}
          </div>

          {/* Explainable indicators */}
          <div className="tl-card" style={{ marginBottom: 16 }}>
            <h2 className="tl-card-title">Why was this tender flagged?</h2>
            {data.indicators?.length === 0 ? (
              <div className="tl-empty">No review indicators for this tender.</div>
            ) : (
              data.indicators.map((i) => <ExplainablePanel key={i.id} indicator={i} />)
            )}
          </div>

          {/* Document similarity */}
          <div className="tl-card" style={{ marginBottom: 16 }}>
            <h2 className="tl-card-title">Similar Tender Documents</h2>
            <DocumentSimilarityList indicators={data.indicators || []} />
          </div>

          {/* Bid analysis table */}
          <div className="tl-card" style={{ marginBottom: 16 }}>
            <h2 className="tl-card-title">Bids</h2>
            <div className="tl-table-wrap">
              <table className="tl-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Company</th>
                    <th>Amount</th>
                    <th>Deviation</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data.bids || data.bids.length === 0) ? (
                    <tr><td colSpan={6}><div className="tl-empty">No bids recorded.</div></td></tr>
                  ) : data.bids.map((b) => (
                    <tr key={b.id}>
                      <td>{b.rank ?? "—"}</td>
                      <td>{b.companyName}</td>
                      <td>{formatCurrency(b.amount, b.currency)}</td>
                      <td>{b.deviationPct !== null ? `${b.deviationPct}%` : "—"}</td>
                      <td>{formatDateTime(b.submittedAt)}</td>
                      <td>{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Runs history */}
          {data.runs?.length > 1 && (
            <div className="tl-card">
              <h2 className="tl-card-title">Previous Runs</h2>
              <table className="tl-table">
                <thead>
                  <tr><th>Started</th><th>Status</th><th>Indicators</th></tr>
                </thead>
                <tbody>
                  {data.runs.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDateTime(r.startedAt)}</td>
                      <td>{r.status}</td>
                      <td>{r.indicatorCount ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 4, fontWeight: 500 }}>{value ?? "—"}</div>
    </div>
  );
}
