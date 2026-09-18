import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { tenderApi } from "../services/tender.js";
import Pagination from "../components/Pagination.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatCurrency, formatDate } from "../utils/format.js";
import { useAuth } from "../hooks/useAuth.js";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "evaluation", label: "Evaluation" },
  { value: "awarded", label: "Awarded" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Tenders() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 20);
  const search = params.get("search") || "";
  const status = params.get("status") || "";
  const sortBy = params.get("sortBy") || "published_at";
  const sortDir = params.get("sortDir") || "desc";

  const [searchInput, setSearchInput] = useState(search);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync search input when URL changes (e.g. from navbar)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const apiParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      status: status || undefined,
      sortBy,
      sortDir,
    }),
    [page, limit, search, status, sortBy, sortDir]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    tenderApi
      .list(apiParams)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit, total: 0, totalPages: 1 });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.error?.message || "Failed to load tenders");
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

  const onSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() || undefined, page: 1 });
  };

  const onChangePage = (p) => updateParams({ page: p });

  const toggleSort = (column) => {
    const dir = sortBy === column && sortDir === "asc" ? "desc" : "asc";
    updateParams({ sortBy: column, sortDir: dir, page: 1 });
  };

  const canCreate = user?.permissions?.includes("tender:create");

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <h1 className="tl-page-title">Tenders</h1>
          <p className="tl-page-sub">Browse, search and filter government procurement tenders.</p>
        </div>
        {canCreate && (
          <button className="tl-btn" style={{ width: "auto" }}>
            + New Tender
          </button>
        )}
      </div>

      <form className="tl-filters" onSubmit={onSearchSubmit}>
        <input
          type="search"
          placeholder="Search tender ID, project, department…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <select value={status} onChange={(e) => updateParams({ status: e.target.value, page: 1 })}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [sb, sd] = e.target.value.split(":");
            updateParams({ sortBy: sb, sortDir: sd, page: 1 });
          }}
        >
          <option value="published_at:desc">Newest published</option>
          <option value="published_at:asc">Oldest published</option>
          <option value="estimated_value:desc">Highest value</option>
          <option value="estimated_value:asc">Lowest value</option>
          <option value="deadline_at:asc">Deadline soon</option>
        </select>
        <button type="submit" className="tl-btn">Search</button>
        <button
          type="button"
          className="tl-btn-ghost"
          onClick={() => {
            setSearchInput("");
            setParams(new URLSearchParams(), { replace: true });
          }}
        >
          Reset
        </button>
      </form>

      {error && <div className="tl-error-bar">{error}</div>}

      <div className="tl-table-wrap">
        <table className="tl-table">
          <thead>
            <tr>
              <th style={{ cursor: "pointer" }} onClick={() => toggleSort("tender_code")}>Tender ID</th>
              <th>Project / Title</th>
              <th>Department</th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("estimated_value")}
              >
                Estimated Value
              </th>
              <th>Location</th>
              <th style={{ cursor: "pointer" }} onClick={() => toggleSort("published_at")}>
                Published
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => toggleSort("deadline_at")}>
                Deadline
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}><div className="tl-loading">Loading tenders…</div></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9}><div className="tl-empty">No tenders match your filters.</div></td></tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/tenders/${t.id}`}>{t.tenderCode}</Link>
                  </td>
                  <td style={{ maxWidth: 340, whiteSpace: "normal" }}>{t.title}</td>
                  <td>{t.departmentName || "—"}</td>
                  <td>{formatCurrency(t.estimatedValue, t.currency)}</td>
                  <td>{t.locationName ? `${t.locationName}, ${t.locationState || ""}` : "—"}</td>
                  <td>{formatDate(t.publishedAt)}</td>
                  <td>{formatDate(t.deadlineAt)}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <Link to={`/tenders/${t.id}`}>View</Link>
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
        onChange={onChangePage}
      />
    </div>
  );
}
