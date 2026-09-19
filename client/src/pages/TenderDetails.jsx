import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { tenderApi } from "../services/tender.js";
import { bidApi } from "../services/bid.js";
import { contractApi } from "../services/contract.js";
import { documentApi } from "../services/document.js";
import { analysisApi } from "../services/analysis.js";
import StatusBadge from "../components/StatusBadge.jsx";
import ExplainablePanel from "../components/ExplainablePanel.jsx";
import { formatCurrency, formatDate, formatDateTime } from "../utils/format.js";
import { useAuth } from "../hooks/useAuth.js";

const TABS = ["Overview", "Documents", "Bids", "Contracts", "Timeline", "Companies", "AI Analysis", "Audit"];

export default function TenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Overview");

  const [bids, setBids] = useState([]);
  const [bidStats, setBidStats] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    tenderApi.get(id)
      .then((res) => { if (!cancelled) setTender(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.error?.message || "Failed to load tender"); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSubLoading(true);
      try {
        if (tab === "Bids" && bids.length === 0) {
          const [b, s] = await Promise.all([bidApi.forTender(id), bidApi.tenderStats(id)]);
          if (cancelled) return;
          setBids(b.data.data || []);
          setBidStats(s.data.data || null);
        }
        if (tab === "Contracts" && contracts.length === 0) {
          const c = await contractApi.forTender(id);
          if (cancelled) return;
          setContracts(c.data.data || []);
        }
        if (tab === "Documents" && documents.length === 0) {
          const d = await documentApi.forTender(id);
          if (cancelled) return;
          setDocuments(d.data.data || []);
        }
        if (tab === "AI Analysis" && !analysis) {
          const a = await analysisApi.get(id);
          if (cancelled) return;
          setAnalysis(a.data.data);
        }
      } catch (err) {
        if (!cancelled) console.warn("Sub-resource load failed", err?.message);
      } finally {
        if (!cancelled) setSubLoading(false);
      }
    };
    if (["Bids", "Contracts", "Documents", "AI Analysis"].includes(tab)) run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, id]);

  const canDelete = user?.permissions?.includes("tender:delete");

  const onDelete = async () => {
    if (!window.confirm("Delete this tender? This cannot be undone.")) return;
    try {
      await tenderApi.remove(id);
      navigate("/tenders", { replace: true });
    } catch (err) {
      alert(err?.response?.data?.error?.message || "Delete failed");
    }
  };

  if (loading) return <div className="tl-loading">Loading tender…</div>;
  if (error) return <div className="tl-error-bar">{error}</div>;
  if (!tender) return null;

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <p className="tl-page-sub" style={{ marginBottom: 2 }}>
            <Link to="/tenders">← Back to Tenders</Link>
          </p>
          <h1 className="tl-page-title">
            {tender.tenderCode} <StatusBadge status={tender.status} />
          </h1>
          <p className="tl-page-sub">{tender.title}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to={`/analysis/${id}`} className="tl-btn" style={{ width: "auto", textDecoration: "none", display: "inline-block" }}>
            Open AI Analysis
          </Link>
          {canDelete && (
            <button className="tl-btn" style={{ width: "auto", background: "#b91c1c" }} onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="tl-card" style={{ marginBottom: 16 }}>
        <div className="tl-grid tl-grid-cols-4">
          <Info label="Department" value={tender.departmentName || "—"} />
          <Info label="Location" value={tender.locationName ? `${tender.locationName}, ${tender.locationState || ""}` : "—"} />
          <Info label="Estimated Value" value={formatCurrency(tender.estimatedValue, tender.currency)} />
          <Info label="Project" value={tender.projectName || "—"} />
          <Info label="Published" value={formatDateTime(tender.publishedAt)} />
          <Info label="Deadline" value={formatDateTime(tender.deadlineAt)} />
          <Info label="Currency" value={tender.currency || "—"} />
          <Info label="Created" value={formatDate(tender.createdAt)} />
        </div>
      </div>

      <div className="tl-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                border: "1px solid #e2e8f0",
                background: tab === t ? "#eff6ff" : "#fff",
                color: tab === t ? "#1d4ed8" : "#334155",
                padding: "6px 12px", borderRadius: 8, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="tl-card">
        <h2 className="tl-card-title">{tab}</h2>

        {tab === "Overview" && (
          <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.6 }}>
            {tender.description || "No description provided."}
          </p>
        )}

        {tab === "Bids" && (
          subLoading ? <div className="tl-loading">Loading bids…</div> : (
            <>
              {bidStats && (
                <div className="tl-grid tl-grid-cols-4" style={{ marginBottom: 14 }}>
                  <Info label="Bidders" value={bidStats.bidCount} />
                  <Info label="Lowest" value={formatCurrency(bidStats.lowestBid, tender.currency)} />
                  <Info label="Average" value={formatCurrency(bidStats.averageBid, tender.currency)} />
                  <Info label="Highest" value={formatCurrency(bidStats.highestBid, tender.currency)} />
                  <Info label="Estimated" value={formatCurrency(bidStats.estimatedValue, tender.currency)} />
                  <Info label="Lowest dev." value={bidStats.lowestDeviationPct !== null ? `${bidStats.lowestDeviationPct}%` : "—"} />
                  <Info label="Highest dev." value={bidStats.highestDeviationPct !== null ? `${bidStats.highestDeviationPct}%` : "—"} />
                  <Info label="Winning bid" value={formatCurrency(bidStats.winningBid, tender.currency)} />
                </div>
              )}
              <div className="tl-table-wrap">
                <table className="tl-table">
                  <thead>
                    <tr>
                      <th>Rank</th><th>Company</th><th>Amount</th><th>Deviation</th><th>Submitted</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.length === 0 ? (
                      <tr><td colSpan={6}><div className="tl-empty">No bids recorded for this tender.</div></td></tr>
                    ) : bids.map((b) => (
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
            </>
          )
        )}

        {tab === "Contracts" && (
          subLoading ? <div className="tl-loading">Loading contracts…</div> : (
            <div className="tl-table-wrap">
              <table className="tl-table">
                <thead>
                  <tr><th>Contract</th><th>Company</th><th>Original</th><th>Current</th><th>Change</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {contracts.length === 0 ? (
                    <tr><td colSpan={6}><div className="tl-empty">No contracts yet for this tender.</div></td></tr>
                  ) : contracts.map((c) => (
                    <tr key={c.id}>
                      <td>{c.contractCode}</td>
                      <td>{c.companyName || "—"}</td>
                      <td>{formatCurrency(c.originalValue, c.currency)}</td>
                      <td>{formatCurrency(c.currentValue, c.currency)}</td>
                      <td>{c.changePct !== null ? `${c.changePct}%` : "—"}</td>
                      <td>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "Documents" && (
          subLoading ? <div className="tl-loading">Loading documents…</div> : (
            <div className="tl-table-wrap">
              <table className="tl-table">
                <thead>
                  <tr><th>Filename</th><th>Type</th><th>Size</th><th>Status</th><th>Uploaded</th></tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr><td colSpan={5}><div className="tl-empty">No documents linked to this tender.</div></td></tr>
                  ) : documents.map((d) => (
                    <tr key={d.id}>
                      <td>{d.originalName}</td>
                      <td>{d.mimeType}</td>
                      <td>{Math.round((d.sizeBytes || 0) / 1024)} KB</td>
                      <td>{d.status}</td>
                      <td>{formatDateTime(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "AI Analysis" && (
          subLoading ? <div className="tl-loading">Loading analysis…</div> : (
            <>
              <div style={{ marginBottom: 12 }}>
                <Link to={`/analysis/${id}`} className="tl-btn" style={{ width: "auto", textDecoration: "none", display: "inline-block" }}>
                  Open full analysis
                </Link>
              </div>
              {(!analysis?.indicators || analysis.indicators.length === 0) ? (
                <div className="tl-empty">No indicators yet. Open the full analysis to run the AI pipeline.</div>
              ) : (
                analysis.indicators.slice(0, 5).map((i) => <ExplainablePanel key={i.id} indicator={i} />)
              )}
            </>
          )
        )}

        {!["Overview", "Bids", "Contracts", "Documents", "AI Analysis"].includes(tab) && (
          <div className="tl-empty">{tab} will be available in a later phase.</div>
        )}
      </div>
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
