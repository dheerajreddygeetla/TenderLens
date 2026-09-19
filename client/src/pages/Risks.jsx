import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { reviewApi } from "../services/review.js";
import Pagination from "../components/Pagination.jsx";
import { formatDateTime } from "../utils/format.js";

const SEV_CLASS = { low: "tl-badge-open", medium: "tl-badge-evaluation", high: "tl-badge-cancelled" };

const STATUSES = ["new", "under_review", "resolved", "dismissed"];
const SEVERITIES = ["low", "medium", "high"];
const TYPES = [
  "Bid Pattern Anomaly",
  "Document Similarity",
  "Participation Anomaly",
  "Contract Modification",
  "Timeline Pattern",
  "Entity Relationship",
  "Geographic Pattern",
  "Data Quality Issue",
];

export default function Risks() {
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 25);
  const severity = params.get("severity") || "";
  const status = params.get("status") || "";
  const type = params.get("type") || "";
  const search = params.get("search") || "";

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(search);

  const updateParams = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: true });
  };

  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const reqs = [
      reviewApi.list({ page, limit, severity: severity || undefined, status: status || undefined, type: type || undefined, search: search || undefined }),
      reviewApi.summary(),
    ];
    Promise.all(reqs)
      .then(([listRes, sumRes]) => {
        if (cancelled) return;
        setRows(listRes.data.data || []);
        setPagination(listRes.data.pagination || { page: 1, limit, total: 0, totalPages: 1 });
        setSummary(sumRes.data.data || null);
      })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.error?.message || "Failed to load indicators"); })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [page, limit, severity, status, type, search]);

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <h1 className="tl-page-title">Risk Center</h1>
          <p className="tl-page-sub">Explainable review indicators created by the AI pipeline. Not determinations of wrongdoing.</p>
        </div>
      </div>

      {summary && (
        <div className="tl-grid tl-grid-cols-4" style={{ marginBottom: 16 }}>
          <SummaryCard label="Total" value={summary.total} />
          <SummaryCard label="High" value={summary.high} tone="danger" />
          <SummaryCard label="Medium" value={summary.medium} tone="warning" />
          <SummaryCard label="Low" value={summary.low} tone="info" />
          <SummaryCard label="New" value={summary.new} />
          <SummaryCard label="Under review" value={summary.under_review} />
          <SummaryCard label="Resolved" value={summary.resolved} />
          <SummaryCard label="Dismissed" value={summary.dismissed} />
        </div>
      )}

      <form
        className="tl-filters"
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ search: searchInput.trim() || undefined, page: 1 });
        }}
      >
        <input
          type="search"
          placeholder="Search title, tender code, company…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <select value={severity} onChange={(e) => updateParams({ severity: e.target.value, page: 1 })}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={status} onChange={(e) => updateParams({ status: e.target.value, page: 1 })}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={type} onChange={(e) => updateParams({ type: e.target.value, page: 1 })}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="submit" className="tl-btn">Search</button>
        <button
          type="button"
          className="tl-btn-ghost"
          onClick={() => { setSearchInput(""); setParams(new URLSearchParams(), { replace: true }); }}
        >
          Reset
        </button>
      </form>

      {error && <div className="tl-error-bar">{error}</div>}

      <div className="tl-table-wrap">
        <table className="tl-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Type</th>
              <th>Title</th>
              <th>Tender</th>
              <th>Company</th>
              <th>Status</th>
              <th>Detected</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}><div className="tl-loading">Loading…</div></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9}><div className="tl-empty">No indicators match your filters.</div></td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td><span className={`tl-badge ${SEV_CLASS[r.severity] || "tl-badge-open"}`}>{r.severity}</span></td>
                <td>{r.type}</td>
                <td style={{ maxWidth: 320, whiteSpace: "normal" }}>{r.title}</td>
                <td>{r.tenderCode ? <Link to={`/tenders/${r.tenderId}`}>{r.tenderCode}</Link> : "—"}</td>
                <td>{r.companyName || "—"}</td>
                <td>{r.status}</td>
                <td>{formatDateTime(r.createdAt)}</td>
                <td>{r.noteCount ?? 0}</td>
                <td><Link to={`/risks/${r.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onChange={(p) => updateParams({ page: p })}
      />
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneColor = tone === "danger" ? "#991b1b" : tone === "warning" ? "#92400e" : tone === "info" ? "#1d4ed8" : "#0f172a";
  return (
    <div className="tl-card">
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: toneColor }}>{value ?? 0}</div>
    </div>
  );
}
