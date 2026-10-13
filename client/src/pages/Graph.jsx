import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { graphApi } from "../services/graph.js";
import GraphCanvas from "../components/graph/GraphCanvas.jsx";
import { useAuth } from "../hooks/useAuth.js";
import {
  Network,
  RefreshCw,
  Search,
  Play,
  Layers,
} from "lucide-react";

const PRESET_LABELS = {
  "tenders-for-company": "Tenders for company",
  "shared-tenders": "Companies that shared tenders",
  "departments-for-company": "Departments for company",
};

const REL_TYPES = [
  "PARTICIPATED_IN",
  "WON",
  "ISSUED_BY",
  "RESULTED_IN",
  "AWARDED_TO",
  "LOCATED_IN",
];

export default function Graph() {
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [center, setCenter] = useState(null); // { kind, id, label }
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [depth, setDepth] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState(REL_TYPES);
  const [preset, setPreset] = useState("");
  const [presetResult, setPresetResult] = useState(null);
  const [runningPreset, setRunningPreset] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const searchTimer = useRef(null);
  const canUpdate = user?.permissions?.includes("company:update");

  // ----- sync status -----
  useEffect(() => {
    graphApi
      .syncStatus()
      .then((res) => setSyncStatus(res.data.data))
      .catch(() => {});
  }, []);

  // ----- debounced search -----
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await graphApi.search(query.trim(), 12);
        setResults(res.data.data || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  const loadNeighborhood = useCallback(
    async (node, opts = {}) => {
      if (!node) return;
      setLoadingGraph(true);
      setError("");
      try {
        const res = await graphApi.neighborhood(node.kind, node.id, {
          depth: opts.depth ?? depth,
          types: opts.types ?? selectedTypes,
        });
        setGraph(res.data.data);
      } catch (err) {
        setError(err?.response?.data?.error?.message || "Failed to load relationship graph");
        setGraph({ nodes: [], links: [] });
      } finally {
        setLoadingGraph(false);
      }
    },
    [depth, selectedTypes]
  );

  const pickCenter = (node) => {
    setCenter(node);
    setResults([]);
    setQuery(node.label || node.name || "");
    setPresetResult(null);
    setPreset("");
    loadNeighborhood(node);
  };

  const onNodeClick = (node) => {
    pickCenter({ kind: node.kind, id: node.id, label: node.label });
  };

  const runSync = async () => {
    setError("");
    setNotice("");
    try {
      const res = await graphApi.sync();
      const c = res.data.data;
      setNotice(
        `Graph rebuilt: ${JSON.stringify(c.nodeCounts)} nodes, ${JSON.stringify(
          c.relCounts
        )} relationships.`
      );
      const s = await graphApi.syncStatus();
      setSyncStatus(s.data.data);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Graph rebuild failed");
    }
  };

  const runPreset = async () => {
    if (!center || center.kind !== "Company" || !preset) return;
    setRunningPreset(true);
    setError("");
    try {
      const res = await graphApi.preset(preset, { companyId: center.id });
      setPresetResult({ name: preset, rows: res.data.data || [] });
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Cartel analysis query failed");
    } finally {
      setRunningPreset(false);
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
            <Network size={14} />
            <span>CARTEL TOPOLOGY &amp; MULTI-HOP NEURAL GRAPH</span>
          </div>
          <h1 className="tl-page-title">Collusion &amp; Relationship Graph</h1>
          <p className="tl-page-sub">
            Trace hidden linkages, shared directorships, circular bidding rings, and front entities.
          </p>
        </div>
        {canUpdate && (
          <button
            className="tl-btn"
            style={{ width: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={runSync}
          >
            <RefreshCw size={14} />
            <span>Rebuild Knowledge Graph</span>
          </button>
        )}
      </div>

      {syncStatus && (
        <div className="tl-card" style={{ marginBottom: 14, fontSize: 12.5 }}>
          <strong>Last Knowledge Sync:</strong>{" "}
          {syncStatus.startedAt ? new Date(syncStatus.startedAt).toLocaleString() : "—"} ·{" "}
          <strong>Status:</strong> {syncStatus.status}
        </div>
      )}

      {error && <div className="tl-error-bar">{error}</div>}
      {notice && (
        <div
          className="tl-card"
          style={{
            marginBottom: 14,
            borderColor: "rgba(16, 185, 129, 0.4)",
            background: "rgba(16, 185, 129, 0.08)",
            color: "#6ee7b7",
            fontSize: 13,
          }}
        >
          {notice}
        </div>
      )}

      {/* Control Card */}
      <div className="tl-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px", minWidth: 260 }}>
            <input
              type="search"
              placeholder="Search company, tender, ministry, contractor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
            {searching && (
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 11,
                  color: "#38bdf8",
                  fontFamily: "var(--tl-font-mono)",
                }}
              >
                querying…
              </span>
            )}
            {results.length > 0 && (
              <ul
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--tl-surface-popover)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid var(--tl-glass-border-bright)",
                  borderRadius: 12,
                  boxShadow: "0 12px 35px rgba(0,0,0,0.5)",
                  listStyle: "none",
                  padding: 6,
                  margin: "6px 0 0 0",
                  zIndex: 20,
                  maxHeight: 320,
                  overflowY: "auto",
                }}
              >
                {results.map((r) => (
                  <li key={`${r.kind}:${r.id}`}>
                    <button
                      onClick={() => pickCenter({ kind: r.kind, id: r.id, label: r.label })}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 12px",
                        background: "transparent",
                        border: 0,
                        cursor: "pointer",
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: "inherit",
                        color: "var(--tl-text-primary)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "var(--tl-font-mono)",
                          color: "#38bdf8",
                          textTransform: "uppercase",
                          marginRight: 8,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "rgba(56, 189, 248, 0.1)",
                        }}
                      >
                        {r.kind}
                      </span>
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <select
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="tl-input-like"
            style={{ minWidth: 110 }}
          >
            <option value={1}>Depth 1</option>
            <option value={2}>Depth 2</option>
            <option value={3}>Depth 3</option>
          </select>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {REL_TYPES.map((t) => {
              const on = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() =>
                    setSelectedTypes((prev) =>
                      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                    )
                  }
                  style={{
                    border: on
                      ? "1px solid rgba(59, 130, 246, 0.45)"
                      : "1px solid var(--tl-glass-border)",
                    background: on
                      ? "linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)"
                      : "var(--tl-surface-glass)",
                    color: on ? "#60a5fa" : "var(--tl-text-muted)",
                    padding: "5px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: "var(--tl-font-mono)",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {center && (
            <button
              className="tl-btn"
              style={{ width: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => loadNeighborhood(center)}
            >
              <RefreshCw size={13} />
              <span>Refresh Node</span>
            </button>
          )}
        </div>

        {center && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid var(--tl-glass-border)",
              fontSize: 12.5,
              color: "var(--tl-text-secondary)",
            }}
          >
            Focal Entity: <strong style={{ color: "#38bdf8" }}>{center.label}</strong>{" "}
            <span style={{ color: "var(--tl-text-dim)" }}>({center.kind})</span>
          </div>
        )}
      </div>

      {/* Graph Visualizer Panel */}
      <div style={{ marginBottom: 20 }}>
        {loadingGraph ? (
          <div className="tl-card tl-loading" style={{ height: 640 }}>
            Simulating force-directed topology &amp; nodal clusters…
          </div>
        ) : !center ? (
          <div
            className="tl-card tl-empty"
            style={{
              height: 640,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: 40,
            }}
          >
            <div>
              <Network size={44} color="#38bdf8" style={{ marginBottom: 14, opacity: 0.7 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tl-text-primary)" }}>
                Entity Relationship Visualizer Ready
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--tl-text-muted)",
                  maxWidth: 420,
                  margin: "8px auto 0",
                }}
              >
                Search for any contractor company, tender code, or department to reveal its
                procurement network graph.
              </p>
            </div>
          </div>
        ) : (
          <GraphCanvas data={graph} onNodeClick={onNodeClick} height={640} />
        )}
      </div>

      {/* Cartel Presets (Only for Companies) */}
      {center?.kind === "Company" && (
        <div className="tl-card">
          <h2 className="tl-card-title">
            <Layers size={17} color="#38bdf8" />
            <span>Forensic Cartel Queries for {center.label}</span>
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="tl-input-like"
              style={{ minWidth: 260 }}
            >
              <option value="">Choose query algorithm…</option>
              {Object.entries(PRESET_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button
              className="tl-btn"
              style={{ width: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={runPreset}
              disabled={!preset || runningPreset}
            >
              <Play size={14} />
              <span>{runningPreset ? "Analyzing Graph…" : "Execute"}</span>
            </button>
          </div>

          {presetResult && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "var(--tl-font-mono)",
                  color: "#38bdf8",
                  marginBottom: 10,
                }}
              >
                Results: {presetResult.name} ({presetResult.rows.length} records)
              </div>
              <div className="tl-table-wrap">
                <table className="tl-table">
                  <thead>
                    <tr>
                      {Object.keys(presetResult.rows[0] || {}).map((k) => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {presetResult.rows.map((r, i) => (
                      <tr key={i}>
                        {Object.entries(r).map(([k, v], j) => (
                          <td key={j}>
                            {k === "id" || k === "companyId" || k === "tenderId" ? (
                              <Link to={k === "companyId" ? `/companies/${v}` : `/tenders/${v}`}>
                                {String(v).slice(0, 8)}…
                              </Link>
                            ) : (
                              String(v ?? "—")
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {presetResult.rows.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="tl-empty">No linkages identified.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
