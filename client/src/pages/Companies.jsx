import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { companyApi } from "../services/company.js";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function Companies() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 20);
  const search = params.get("search") || "";
  const sortBy = params.get("sortBy") || "name";
  const sortDir = params.get("sortDir") || "asc";

  const [searchInput, setSearchInput] = useState(search);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => setSearchInput(search), [search]);

  const apiParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      sortBy,
      sortDir,
    }),
    [page, limit, search, sortBy, sortDir]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    companyApi
      .list(apiParams)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit, total: 0, totalPages: 1 });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.error?.message || "Failed to load companies");
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

  const canUpdate = user?.permissions?.includes("company:update");

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <h1 className="tl-page-title">Companies</h1>
          <p className="tl-page-sub">Registered contractors and firms participating in public tenders.</p>
        </div>
        {canUpdate && (
          <button className="tl-btn" style={{ width: "auto" }}>+ New Company</button>
        )}
      </div>

      <form
        className="tl-filters"
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ search: searchInput.trim() || undefined, page: 1 });
        }}
      >
        <input
          type="search"
          placeholder="Search company name, registration ID, industry…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ minWidth: 280 }}
        />
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
              <th>Company</th>
              <th>Registration ID</th>
              <th>Industry</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="tl-loading">Loading companies…</div></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6}><div className="tl-empty">No companies match your search.</div></td></tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/companies/${c.id}`}>{c.name}</Link>
                  </td>
                  <td>{c.registrationId || "—"}</td>
                  <td>{c.industry || "—"}</td>
                  <td>{c.locationName ? `${c.locationName}, ${c.locationState || ""}` : "—"}</td>
                  <td>
                    <span className="tl-badge tl-badge-awarded">{c.isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td>
                    <Link to={`/companies/${c.id}`}>View</Link>
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
