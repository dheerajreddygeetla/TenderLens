import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { bidApi } from "../services/bid.js";
import Pagination from "../components/Pagination.jsx";
import { formatCurrency, formatDateTime } from "../utils/format.js";
import { Coins } from "lucide-react";

const deviationBadge = (pct) => {
  if (pct === null || pct === undefined) return <span>—</span>;
  const n = Number(pct);
  const cls = n <= -5 ? "tl-badge-awarded" : n <= 5 ? "tl-badge-open" : "tl-badge-cancelled";
  const label = `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
  return (
    <span className={`tl-badge ${cls}`} style={{ fontFamily: "var(--tl-font-mono)", fontWeight: 700 }}>
      {label}
    </span>
  );
};

export default function Bids() {
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 25);
  const status = params.get("status") || "";
  const sortBy = params.get("sortBy") || "amount";
  const sortDir = params.get("sortDir") || "asc";

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiParams = useMemo(
    () => ({ page, limit, status: status || undefined, sortBy, sortDir }),
    [page, limit, status, sortBy, sortDir]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    bidApi
      .list(apiParams)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit, total: 0, totalPages: 1 });
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.error?.message || "Failed to load bids");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [apiParams, limit]);

  const updateParams = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: true });
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
            <Coins size={14} />
            <span>PRICING MATRIX &amp; DEVIATION AUDIT</span>
          </div>
          <h1 className="tl-page-title">Bids &amp; Submitted Pricing</h1>
          <p className="tl-page-sub">
            Submittal amounts compared against benchmark engineering estimates and tender thresholds.
          </p>
        </div>
      </div>

      {error && <div className="tl-error-bar">{error}</div>}

      <div className="tl-filters">
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
          className="tl-input-like"
        >
          <option value="">All bid statuses</option>
          <option value="submitted">Submitted</option>
          <option value="evaluated">Evaluated</option>
          <option value="awarded">Awarded</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [sb, sd] = e.target.value.split(":");
            updateParams({ sortBy: sb, sortDir: sd, page: 1 });
          }}
          className="tl-input-like"
        >
          <option value="amount:asc">Amount (Low → High)</option>
          <option value="amount:desc">Amount (High → Low)</option>
          <option value="submitted_at:desc">Newest submission</option>
          <option value="rank:asc">Rank</option>
        </select>
      </div>

      <div className="tl-table-wrap">
        <table className="tl-table">
          <thead>
            <tr>
              <th>Target Tender</th>
              <th>Contractor Entity</th>
              <th>Submitted Amount</th>
              <th>Estimated Benchmark</th>
              <th>Variance (%)</th>
              <th>Timestamp</th>
              <th>Rank</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="tl-loading">Loading pricing submittals…</div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="tl-empty">No bids match active filters.</div>
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link
                      to={`/tenders/${b.tenderId}`}
                      style={{ fontFamily: "var(--tl-font-mono)", color: "#38bdf8", fontWeight: 600 }}
                    >
                      {b.tenderCode}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 600 }}>{b.companyName}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(b.amount, b.currency)}</td>
                  <td style={{ color: "var(--tl-text-muted)" }}>
                    {formatCurrency(b.estimatedValue, b.tenderCurrency)}
                  </td>
                  <td>{deviationBadge(b.deviationPct)}</td>
                  <td style={{ fontSize: 12, color: "var(--tl-text-muted)" }}>
                    {formatDateTime(b.submittedAt)}
                  </td>
                  <td style={{ fontFamily: "var(--tl-font-mono)", fontWeight: 700 }}>
                    {b.rank ? `#${b.rank}` : "—"}
                  </td>
                  <td>
                    <span
                      className={`tl-badge ${
                        b.status === "awarded"
                          ? "tl-badge-awarded"
                          : b.status === "rejected"
                          ? "tl-badge-cancelled"
                          : "tl-badge-open"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
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
