import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { companyApi } from "../services/company.js";
import { graphApi } from "../services/graph.js";
import GraphCanvas from "../components/graph/GraphCanvas.jsx";
import { formatCurrency, formatDate, formatDateTime } from "../utils/format.js";

const TABS = ["Overview", "Tenders", "Contracts", "Relationships", "Timeline"];

export default function CompanyDetails() {
  const { id } = useParams();
  const [tab, setTab] = useState("Overview");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tenders, setTenders] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [departments, setDepartments] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [graph, setGraph] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    companyApi.profile(id)
      .then((res) => { if (!cancelled) setProfile(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.error?.message || "Failed to load company"); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSubLoading(true);
      try {
        if (tab === "Tenders" && !tenders) {
          const r = await companyApi.tenders(id);
          if (!cancelled) setTenders(r.data.data || []);
        }
        if (tab === "Contracts" && !contracts) {
          const r = await companyApi.contracts(id);
          if (!cancelled) setContracts(r.data.data || []);
        }
        if (tab === "Overview" && !departments) {
          const r = await companyApi.departments(id);
          if (!cancelled) setDepartments(r.data.data || []);
        }
        if (tab === "Timeline" && !timeline) {
          const r = await companyApi.timeline(id);
          if (!cancelled) setTimeline(r.data.data || []);
        }
        if (tab === "Relationships" && !graph) {
          const r = await graphApi.neighborhood("Company", id, { depth: 2 });
          if (!cancelled) setGraph(r.data.data);
        }
      } catch (err) {
        if (!cancelled) console.warn("Sub-resource load failed", err?.message);
      } finally {
        if (!cancelled) setSubLoading(false);
      }
    };
    if (["Tenders", "Contracts", "Relationships", "Timeline", "Overview"].includes(tab)) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, id]);

  if (loading) return <div className="tl-loading">Loading company…</div>;
  if (error) return <div className="tl-error-bar">{error}</div>;
  if (!profile) return null;

  const { company, summary } = profile;

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <p className="tl-page-sub" style={{ marginBottom: 2 }}>
            <Link to="/companies">← Back to Companies</Link>
          </p>
          <h1 className="tl-page-title">{company.name}</h1>
          <p className="tl-page-sub">{company.industry || "—"}</p>
        </div>
      </div>

      <div className="tl-card" style={{ marginBottom: 16 }}>
        <div className="tl-grid tl-grid-cols-4">
          <Info label="Registration ID" value={company.registrationId || "—"} />
          <Info label="Industry" value={company.industry || "—"} />
          <Info label="Location" value={company.locationName ? `${company.locationName}, ${company.locationState || ""}` : "—"} />
          <Info label="Registered" value={formatDate(company.createdAt)} />
          <Info label="Tenders participated" value={summary.tendersParticipated} />
          <Info label="Tenders won" value={summary.tendersWon} />
          <Info label="Contracts" value={summary.contractCount} />
          <Info label="Total contract value" value={formatCurrency(summary.totalContractValue, "INR")} />
          <Info label="Departments" value={summary.departments} />
          <Info label="Review indicators" value={summary.reviewIndicators} />
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
                padding: "6px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
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
          subLoading && !departments ? (
            <div className="tl-loading">Loading…</div>
          ) : (
            <>
              <h3 style={{ marginTop: 0, fontSize: 14 }}>Departments</h3>
              <div className="tl-table-wrap" style={{ marginBottom: 14 }}>
                <table className="tl-table">
                  <thead><tr><th>Department</th><th>Participations</th><th>Total bid value</th></tr></thead>
                  <tbody>
                    {(!departments || departments.length === 0) ? (
                      <tr><td colSpan={3}><div className="tl-empty">No department interactions.</div></td></tr>
                    ) : departments.map((d) => (
                      <tr key={d.departmentId}>
                        <td>{d.name}</td>
                        <td>{d.participations}</td>
                        <td>{formatCurrency(d.totalBidValue, "INR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}

        {tab === "Tenders" && (
          subLoading ? <div className="tl-loading">Loading tenders…</div> : (
            <div className="tl-table-wrap">
              <table className="tl-table">
                <thead>
                  <tr><th>Tender</th><th>Title</th><th>Department</th><th>Bid amount</th><th>Rank</th><th>Bid status</th><th>Submitted</th></tr>
                </thead>
                <tbody>
                  {(!tenders || tenders.length === 0) ? (
                    <tr><td colSpan={7}><div className="tl-empty">No tenders.</div></td></tr>
                  ) : tenders.map((t) => (
                    <tr key={`${t.id}-${t.submittedAt}`}>
                      <td><Link to={`/tenders/${t.id}`}>{t.tenderCode}</Link></td>
                      <td style={{ maxWidth: 320, whiteSpace: "normal" }}>{t.title}</td>
                      <td>{t.departmentName || "—"}</td>
                      <td>{formatCurrency(t.bidAmount, t.currency)}</td>
                      <td>{t.rank ?? "—"}</td>
                      <td>{t.bidStatus}</td>
                      <td>{formatDateTime(t.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "Contracts" && (
          subLoading ? <div className="tl-loading">Loading contracts…</div> : (
            <div className="tl-table-wrap">
              <table className="tl-table">
                <thead>
                  <tr><th>Contract</th><th>Tender</th><th>Original</th><th>Current</th><th>Amendments</th><th>Status</th><th>Period</th></tr>
                </thead>
                <tbody>
                  {(!contracts || contracts.length === 0) ? (
                    <tr><td colSpan={7}><div className="tl-empty">No contracts.</div></td></tr>
                  ) : contracts.map((c) => (
                    <tr key={c.id}>
                      <td>{c.contractCode}</td>
                      <td>{c.tenderCode ? <Link to={`/tenders/${c.tenderId}`}>{c.tenderCode}</Link> : "—"}</td>
                      <td>{formatCurrency(c.originalValue, c.currency)}</td>
                      <td>{formatCurrency(c.currentValue, c.currency)}</td>
                      <td>{c.amendmentCount}</td>
                      <td>{c.status}</td>
                      <td>{formatDate(c.startDate)} → {formatDate(c.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "Relationships" && (
          subLoading ? <div className="tl-loading">Loading graph…</div> :
          graph ? (
            <>
              <div style={{ marginBottom: 10, fontSize: 12.5, color: "#64748b" }}>
                Click any node to jump to that entity.
              </div>
              <GraphCanvas
                data={graph}
                height={520}
                onNodeClick={() => { /* read-only from company page */ }}
              />
            </>
          ) : (
            <div className="tl-empty">No graph data. Try rebuilding the graph from the Graph page.</div>
          )
        )}

        {tab === "Timeline" && (
          subLoading ? <div className="tl-loading">Loading timeline…</div> : (
            (!timeline || timeline.length === 0) ? (
              <div className="tl-empty">No activity.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {timeline.map((e, i) => (
                  <li key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>
                      {formatDateTime(e.at)} · <strong>{e.kind}</strong>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {e.kind === "bid" && (
                        <>
                          Bid on <Link to={`/tenders/${e.payload.tenderId}`}>{e.payload.tenderCode}</Link> — {formatCurrency(e.payload.amount, "INR")} · rank {e.payload.rank ?? "—"} · {e.payload.status}
                        </>
                      )}
                      {e.kind === "contract" && (
                        <>
                          Contract {e.payload.contractCode} — {formatCurrency(e.payload.currentValue, "INR")} · {e.payload.status}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          )
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
