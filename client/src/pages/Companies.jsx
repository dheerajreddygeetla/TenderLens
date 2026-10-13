import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { companyApi } from "../services/company.js";
import { entityMatchApi } from "../services/entityMatch.js";
import Pagination from "../components/Pagination.jsx";
import Tilt3DCard from "../components/Tilt3DCard.jsx";
import { useAuth } from "../hooks/useAuth.js";
import {
  Building2,
  Search,
  RotateCcw,
  Plus,
  Sparkles,
  Check,
  X,
  MapPin,
  RefreshCw,
} from "lucide-react";

const TABS = ["Companies", "Possible matches"];

export default function Companies() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "Companies");

  // Shared
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Companies tab
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 20);
  const search = params.get("search") || "";
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [searchInput, setSearchInput] = useState(search);

  // Matches tab
  const [matches, setMatches] = useState([]);
  const [matchStats, setMatchStats] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchFilter, setMatchFilter] = useState("pending");
  const [minConf, setMinConf] = useState(0);

  useEffect(() => setSearchInput(search), [search]);

  const apiParams = useMemo(
    () => ({ page, limit, search: search || undefined }),
    [page, limit, search]
  );

  useEffect(() => {
    if (tab !== "Companies") return;
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
        if (!cancelled)
          setError(err?.response?.data?.error?.message || "Failed to load companies");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [apiParams, limit, tab]);

  const loadMatches = async () => {
    setMatchLoading(true);
    setError("");
    try {
      const [listRes, statsRes] = await Promise.all([
        entityMatchApi.list({ status: matchFilter, minConfidence: minConf || undefined }),
        entityMatchApi.stats(),
      ]);
      setMatches(listRes.data.data || []);
      setMatchStats(statsRes.data.data || null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Failed to load matches");
    } finally {
      setMatchLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "Possible matches") loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, matchFilter, minConf]);

  const updateParams = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: true });
  };

  const changeTab = (t) => {
    setTab(t);
    updateParams({ tab: t });
  };

  const canUpdate = user?.permissions?.includes("company:update");

  const generate = async () => {
    try {
      setMatchLoading(true);
      const res = await entityMatchApi.generate({ threshold: 0.5, maxPairs: 500 });
      await loadMatches();
      if (res.data.data.created === 0) {
        alert("No new candidate pairs generated.");
      }
    } catch (err) {
      alert(err?.response?.data?.error?.message || "Generate failed");
    } finally {
      setMatchLoading(false);
    }
  };

  const decide = async (id, decision) => {
    try {
      await entityMatchApi.decide(id, decision);
      await loadMatches();
    } catch (err) {
      alert(err?.response?.data?.error?.message || "Failed to save decision");
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
            <Building2 size={14} />
            <span>CONTRACTOR INTELLIGENCE &amp; SHELL DEDUPLICATION</span>
          </div>
          <h1 className="tl-page-title">Corporate Intelligence Dossiers</h1>
          <p className="tl-page-sub">
            Track participating corporate entities, ownership structures, and deduplication
            matches.
          </p>
        </div>
        {canUpdate && tab === "Companies" && (
          <button className="tl-btn" style={{ width: "auto" }}>
            <Plus size={16} />
            <span>Register Company</span>
          </button>
        )}
        {canUpdate && tab === "Possible matches" && (
          <button
            className="tl-btn"
            style={{ width: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={generate}
          >
            <Sparkles size={16} />
            <span>Generate Match Candidates</span>
          </button>
        )}
      </div>

      {/* Frosted Glass Tabs */}
      <div
        style={{
          display: "inline-flex",
          gap: 6,
          marginBottom: 20,
          background: "var(--tl-surface-card)",
          backdropFilter: "var(--tl-glass-blur)",
          padding: 6,
          borderRadius: 14,
          border: "1px solid var(--tl-glass-border)",
        }}
      >
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => changeTab(t)}
              style={{
                border: active ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid transparent",
                background: active
                  ? "linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)"
                  : "transparent",
                color: active ? "#60a5fa" : "var(--tl-text-secondary)",
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: active ? "0 4px 14px rgba(37, 99, 235, 0.2)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {error && <div className="tl-error-bar">{error}</div>}

      {tab === "Companies" && (
        <>
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
                placeholder="Search company name, registration ID, sector…"
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
                setParams(new URLSearchParams({ tab: "Companies" }), { replace: true });
              }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </form>

          <div className="tl-table-wrap">
            <table className="tl-table">
              <thead>
                <tr>
                  <th>Corporate Entity</th>
                  <th>Registration ID</th>
                  <th>Industry Sector</th>
                  <th>Jurisdiction</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="tl-loading">Querying corporate dossiers…</div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="tl-empty">No companies match your search criteria.</div>
                    </td>
                  </tr>
                ) : (
                  rows.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link
                          to={`/companies/${c.id}`}
                          style={{ fontWeight: 600, color: "#38bdf8" }}
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td style={{ fontFamily: "var(--tl-font-mono)", fontSize: 12 }}>
                        {c.registrationId || "—"}
                      </td>
                      <td>{c.industry || "—"}</td>
                      <td>
                        {c.locationName ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <MapPin size={12} color="var(--tl-text-muted)" />
                            <span>
                              {c.locationName}, {c.locationState || ""}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span
                          className={`tl-badge ${
                            c.isActive ? "tl-badge-awarded" : "tl-badge-completed"
                          }`}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/companies/${c.id}`}
                          className="tl-btn-ghost"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          Dossier
                        </Link>
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
        </>
      )}

      {tab === "Possible matches" && (
        <>
          {matchStats && (
            <div className="tl-grid tl-grid-cols-4" style={{ marginBottom: 20 }}>
              <Tilt3DCard>
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--tl-text-muted)", fontWeight: 700 }}>
                  Total Pairs Evaluated
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "var(--tl-text-primary)" }}>
                  {matchStats.total}
                </div>
              </Tilt3DCard>
              <Tilt3DCard>
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, color: "#fbbf24", fontWeight: 700 }}>
                  Pending Verification
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#fbbf24" }}>
                  {matchStats.pending}
                </div>
              </Tilt3DCard>
              <Tilt3DCard>
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, color: "#34d399", fontWeight: 700 }}>
                  Confirmed Aliases
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#34d399" }}>
                  {matchStats.confirmed}
                </div>
              </Tilt3DCard>
              <Tilt3DCard>
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--tl-text-dim)", fontWeight: 700 }}>
                  Rejected / Dissimilar
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "var(--tl-text-muted)" }}>
                  {matchStats.rejected}
                </div>
              </Tilt3DCard>
            </div>
          )}

          <div className="tl-filters">
            <select
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value)}
              className="tl-input-like"
            >
              <option value="pending">Pending Verification</option>
              <option value="confirmed">Confirmed Aliases</option>
              <option value="rejected">Rejected Matches</option>
              <option value="all">All Evaluated</option>
            </select>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={minConf}
              onChange={(e) => setMinConf(Number(e.target.value))}
              placeholder="Min confidence (0.0 - 1.0)"
              className="tl-input-like"
              style={{ width: 160 }}
            />
            <button
              className="tl-btn-ghost"
              onClick={loadMatches}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} />
              <span>Refresh Candidates</span>
            </button>
          </div>

          <div className="tl-table-wrap">
            <table className="tl-table">
              <thead>
                <tr>
                  <th>Match Confidence</th>
                  <th>Candidate Company A</th>
                  <th>Candidate Company B</th>
                  <th>Forensic Match Basis</th>
                  <th>Verification Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matchLoading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="tl-loading">Analyzing entity deduplication records…</div>
                    </td>
                  </tr>
                ) : matches.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="tl-empty">No possible shell/alias matches found.</div>
                    </td>
                  </tr>
                ) : (
                  matches.map((m) => (
                    <tr key={m.id}>
                      <td
                        style={{
                          fontWeight: 800,
                          fontFamily: "var(--tl-font-mono)",
                          color: Number(m.confidence) > 0.8 ? "#34d399" : "#fbbf24",
                        }}
                      >
                        {(Number(m.confidence) * 100).toFixed(1)}%
                      </td>
                      <td>
                        <Link
                          to={`/companies/${m.companyAId}`}
                          style={{ fontWeight: 600, color: "#38bdf8" }}
                        >
                          {m.companyAName}
                        </Link>
                        <div style={{ fontSize: 11, color: "var(--tl-text-dim)" }}>
                          {m.companyARegistration || "—"}
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/companies/${m.companyBId}`}
                          style={{ fontWeight: 600, color: "#38bdf8" }}
                        >
                          {m.companyBName}
                        </Link>
                        <div style={{ fontSize: 11, color: "var(--tl-text-dim)" }}>
                          {m.companyBRegistration || "—"}
                        </div>
                      </td>
                      <td style={{ maxWidth: 280, whiteSpace: "normal", fontSize: 12 }}>
                        Name similarity: {Number(m.reasons?.nameSimilarity || 0).toFixed(2)}
                        {m.reasons?.registrationMatch ? " · Registration verified ✓" : ""}
                      </td>
                      <td>
                        <span
                          className={`tl-badge ${
                            m.status === "confirmed"
                              ? "tl-badge-awarded"
                              : m.status === "rejected"
                              ? "tl-badge-cancelled"
                              : "tl-badge-evaluation"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td>
                        {canUpdate && m.status === "pending" ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => decide(m.id, "confirmed")}
                              className="tl-btn"
                              style={{
                                padding: "4px 8px",
                                fontSize: 11,
                                background: "#059669",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Check size={12} />
                              <span>Confirm Alias</span>
                            </button>
                            <button
                              onClick={() => decide(m.id, "rejected")}
                              className="tl-btn-ghost"
                              style={{
                                padding: "4px 8px",
                                fontSize: 11,
                                color: "#f87171",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
