import { Fragment, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { contractApi } from "../services/contract.js";
import Pagination from "../components/Pagination.jsx";
import { formatCurrency, formatDate } from "../utils/format.js";
import { FileCheck, Search, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

const changeBadge = (pct) => {
  if (pct === null || pct === undefined || pct === "") return <span>—</span>;
  const n = Number(pct);
  if (Number.isNaN(n)) return <span>—</span>;
  const cls =
    Math.abs(n) >= 15
      ? "tl-badge-cancelled"
      : Math.abs(n) >= 5
      ? "tl-badge-evaluation"
      : "tl-badge-awarded";
  return (
    <span
      className={`tl-badge ${cls}`}
      style={{ fontFamily: "var(--tl-font-mono)", fontWeight: 700 }}
    >
      {n > 0 ? "+" : ""}
      {n.toFixed(2)}%
    </span>
  );
};

export default function Contracts() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 20);
  const status = params.get("status") || "";
  const search = params.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});
  const [amendments, setAmendments] = useState({});
  const [expandingId, setExpandingId] = useState(null);

  useEffect(() => setSearchInput(search), [search]);

  const load = () => {
    setLoading(true);
    setError("");
    contractApi
      .list({ page, limit, status: status || undefined, search: search || undefined })
      .then((res) => {
        setRows(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit, total: 0, totalPages: 1 });
      })
      .catch((err) => setError(err?.response?.data?.error?.message || "Failed to load contracts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, search]);

  const updateParams = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: true });
  };

  const toggleExpand = async (id) => {
    const next = { ...expanded, [id]: !expanded[id] };
    setExpanded(next);
    if (next[id] && !amendments[id]) {
      setExpandingId(id);
      try {
        const res = await contractApi.get(id);
        setAmendments((prev) => ({ ...prev, [id]: res.data?.data?.amendments || [] }));
      } catch (err) {
        alert(err?.response?.data?.error?.message || "Failed to load amendments");
      } finally {
        setExpandingId(null);
      }
    }
  };

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
            <FileCheck size={14} />
            <span>BINDING CONTRACT AWARDS &amp; AMENDMENTS AUDIT</span>
          </div>
          <h1 className="tl-page-title">Contract Awards &amp; Modifications</h1>
          <p className="tl-page-sub">
            Contractual commitments, cost growth variance, and post-award amendment tracking.
          </p>
        </div>
      </div>

      <form
        className="tl-filters"
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ search: searchInput.trim() || undefined, page: 1 });
        }}
      >
        <div style={{ position: "relative", minWidth: 280 }}>
          <input
            type="search"
            placeholder="Search contract code, contractor, tender…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="tl-input-like"
            style={{ width: "100%", paddingLeft: 34 }}
          />
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--tl-text-muted)",
              pointerEvents: "none",
            }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
          className="tl-input-like"
        >
          <option value="">All contract statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="terminated">Terminated</option>
        </select>

        <button type="submit" className="tl-btn" style={{ gap: 6 }}>
          <Search size={14} />
          <span>Search</span>
        </button>

        <button
          type="button"
          className="tl-btn-ghost"
          style={{ gap: 6 }}
          onClick={() => {
            setSearchInput("");
            setParams(new URLSearchParams(), { replace: true });
          }}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </form>

      {error && <div className="tl-error-bar">{error}</div>}

      <div className="tl-table-wrap">
        <table className="tl-table">
          <thead>
            <tr>
              <th>Contract Code</th>
              <th>Parent Tender</th>
              <th>Contractor Entity</th>
              <th>Award Value</th>
              <th>Current Value</th>
              <th>Cost Variance</th>
              <th>Timeline</th>
              <th>Status</th>
              <th>Modifications</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9}>
                  <div className="tl-loading">Fetching contract ledger…</div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="tl-empty">No contracts match your search filters.</div>
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <Fragment key={c.id}>
                  <tr>
                    <td>
                      <strong style={{ fontFamily: "var(--tl-font-mono)", color: "#38bdf8" }}>
                        {c.contractCode}
                      </strong>
                    </td>
                    <td>
                      {c.tenderCode ? (
                        <Link to={`/tenders/${c.tenderId}`}>{c.tenderCode}</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.companyName || "—"}</td>
                    <td>{formatCurrency(c.originalValue, c.currency)}</td>
                    <td style={{ fontWeight: 700 }}>
                      {formatCurrency(c.currentValue, c.currency)}
                    </td>
                    <td>{changeBadge(c.changePct)}</td>
                    <td style={{ fontSize: 12, color: "var(--tl-text-muted)" }}>
                      {formatDate(c.startDate)} → {formatDate(c.endDate)}
                    </td>
                    <td>
                      <span
                        className={`tl-badge ${
                          c.status === "active"
                            ? "tl-badge-open"
                            : c.status === "completed"
                            ? "tl-badge-awarded"
                            : "tl-badge-cancelled"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.amendmentCount > 0 ? (
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="tl-btn-ghost"
                          style={{
                            padding: "3px 8px",
                            fontSize: 11.5,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span>{expanded[c.id] ? "Hide" : "Inspect"}</span>
                          <span>({c.amendmentCount})</span>
                          {expanded[c.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      ) : (
                        <span style={{ color: "var(--tl-text-dim)" }}>0</span>
                      )}
                    </td>
                  </tr>
                  {expanded[c.id] && (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          background: "rgba(59, 130, 246, 0.05)",
                          padding: 16,
                          borderBottom: "1px solid var(--tl-glass-border)",
                        }}
                      >
                        {expandingId === c.id ? (
                          <div className="tl-loading">Retrieving amendment history…</div>
                        ) : (
                          <table style={{ width: "100%", fontSize: 12.5 }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: 6 }}>Mod #</th>
                                <th style={{ textAlign: "left", padding: 6 }}>Scope Amendment Description</th>
                                <th style={{ textAlign: "left", padding: 6 }}>Δ Cost Added</th>
                                <th style={{ textAlign: "left", padding: 6 }}>Revised Delivery Date</th>
                                <th style={{ textAlign: "left", padding: 6 }}>Enactment Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(amendments[c.id] || []).map((a) => (
                                <tr key={a.id}>
                                  <td
                                    style={{
                                      padding: 6,
                                      fontFamily: "var(--tl-font-mono)",
                                      fontWeight: 700,
                                    }}
                                  >
                                    #{a.amendmentNo}
                                  </td>
                                  <td style={{ padding: 6, maxWidth: 380 }}>{a.description}</td>
                                  <td style={{ padding: 6, fontWeight: 700, color: "#f87171" }}>
                                    {formatCurrency(a.valueDelta ?? a.valueChange, c.currency)}
                                  </td>
                                  <td style={{ padding: 6 }}>{formatDate(a.newEndDate)}</td>
                                  <td style={{ padding: 6, color: "var(--tl-text-muted)" }}>
                                    {formatDate(a.effectiveDate ?? a.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
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
