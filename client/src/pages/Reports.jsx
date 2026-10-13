import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { reportsApi } from "../services/reports.js";
import { auditApi } from "../services/audit.js";
import { tenderApi } from "../services/tender.js";
import { companyApi } from "../services/company.js";
import Pagination from "../components/Pagination.jsx";
import { formatDateTime } from "../utils/format.js";
import {
  FilePlus,
  History,
  ShieldAlert,
  Download,
  Trash2,
  RefreshCw,
} from "lucide-react";

const TABS = ["Generate", "History", "Audit Log"];

const KIND_OPTIONS = [
  { value: "tender_analysis", label: "Tender Analysis Dossier" },
  { value: "company", label: "Company Intelligence Dossier" },
  { value: "audit", label: "System Integrity Audit Log" },
];

const FORMAT_OPTIONS = [
  { value: "pdf", label: "Executive PDF Dossier" },
  { value: "csv", label: "Data Pipeline (CSV)" },
  { value: "xlsx", label: "Spreadsheet Analytics (XLSX)" },
];

const humanBytes = (n) => {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = Number(n),
    i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "Generate");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const changeTab = (t) => {
    setTab(t);
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <h1 className="tl-page-title">Executive Reports &amp; Audit Trail</h1>
          <p className="tl-page-sub">
            Generate forensic intelligence dossiers and inspect tamper-evident audit logs.
          </p>
        </div>
      </div>

      {/* Frosted Glass Segmented Control Tabs */}
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
      {notice && (
        <div
          className="tl-card"
          style={{
            marginBottom: 16,
            borderColor: "rgba(16, 185, 129, 0.4)",
            background: "rgba(16, 185, 129, 0.08)",
            color: "#6ee7b7",
            fontSize: 13.5,
          }}
        >
          {notice}
        </div>
      )}

      {tab === "Generate" && <GenerateTab onNotice={setNotice} onError={setError} />}
      {tab === "History" && <HistoryTab onNotice={setNotice} onError={setError} />}
      {tab === "Audit Log" && <AuditTab onError={setError} />}
    </div>
  );
}

// ---------------------------------------------------------------- Generate
function GenerateTab({ onNotice, onError }) {
  const [kind, setKind] = useState("tender_analysis");
  const [format, setFormat] = useState("pdf");
  const [resourceId, setResourceId] = useState("");
  const [resourceOptions, setResourceOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (kind === "tender_analysis") {
      setLoadingOptions(true);
      tenderApi
        .list({ limit: 100 })
        .then((res) =>
          setResourceOptions(
            (res.data.data || []).map((t) => ({
              id: t.id,
              label: `${t.tenderCode} — ${t.title}`,
            }))
          )
        )
        .catch(() => setResourceOptions([]))
        .finally(() => setLoadingOptions(false));
    } else if (kind === "company") {
      setLoadingOptions(true);
      companyApi
        .list({ limit: 100 })
        .then((res) =>
          setResourceOptions(
            (res.data.data || []).map((c) => ({ id: c.id, label: c.name }))
          )
        )
        .catch(() => setResourceOptions([]))
        .finally(() => setLoadingOptions(false));
    } else {
      setResourceOptions([]);
    }
  }, [kind]);

  const submit = async (e) => {
    e.preventDefault();
    onError("");
    onNotice("");
    if (kind !== "audit" && !resourceId) return onError("Pick an entity or tender to audit");
    setGenerating(true);
    try {
      await reportsApi.generate({ kind, format, resourceId: resourceId || undefined });
      onNotice("Dossier compilation queued. Check the History tab for download.");
      setResourceId("");
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="tl-card" style={{ maxWidth: 680 }}>
      <h2 className="tl-card-title">
        <FilePlus size={17} color="#38bdf8" />
        <span>Generate Forensic Dossier</span>
      </h2>
      <form onSubmit={submit}>
        <Row label="Dossier Type">
          <select
            className="tl-input-like"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>

        {kind !== "audit" && (
          <Row label={kind === "company" ? "Contractor Entity" : "Tender Record"}>
            <select
              className="tl-input-like"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? "Loading candidates…" : "Choose target…"}</option>
              {resourceOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Row>
        )}

        <Row label="Output Format">
          <select
            className="tl-input-like"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            {FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>

        <div style={{ marginTop: 18 }}>
          <button className="tl-btn" style={{ width: "auto" }} disabled={generating}>
            {generating ? "Compiling Dossier…" : "Generate Official Report"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- History
function HistoryTab({ onNotice, onError }) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("");

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await reportsApi.list({ page, limit: 25, kind: kind || undefined });
        setRows(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      } catch (err) {
        onError(err?.response?.data?.error?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    },
    [kind, onError]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm("Permanently purge this report?")) return;
    try {
      await reportsApi.remove(id);
      load(pagination.page);
      onNotice("Report purged.");
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to delete");
    }
  };

  return (
    <div className="tl-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h2 className="tl-card-title" style={{ margin: 0 }}>
          <History size={17} color="#38bdf8" />
          <span>Report Archive &amp; Downloads</span>
        </h2>
        <select
          className="tl-input-like"
          style={{ maxWidth: 220 }}
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="">All report types</option>
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="tl-table-wrap">
        <table className="tl-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Dossier Kind</th>
              <th>Format</th>
              <th>Issued By</th>
              <th>File Size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="tl-loading">Loading report repository…</div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="tl-empty">No reports generated yet.</div>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td style={{ fontWeight: 600 }}>{r.kind}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "rgba(59, 130, 246, 0.12)",
                        color: "#60a5fa",
                        fontFamily: "var(--tl-font-mono)",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {r.format.toUpperCase()}
                    </span>
                  </td>
                  <td>{r.requestedByName || "—"}</td>
                  <td style={{ fontFamily: "var(--tl-font-mono)" }}>{humanBytes(r.sizeBytes)}</td>
                  <td>
                    <span
                      className={`tl-badge ${
                        r.status === "ready"
                          ? "tl-badge-awarded"
                          : r.status === "failed"
                          ? "tl-badge-cancelled"
                          : "tl-badge-evaluation"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {r.status === "ready" && (
                      <a
                        href={reportsApi.downloadUrl(r.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="tl-btn-ghost"
                        style={{
                          marginRight: 8,
                          padding: "4px 8px",
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                    )}
                    <button
                      onClick={() => remove(r.id)}
                      style={{
                        background: "transparent",
                        border: 0,
                        color: "#f87171",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 12,
                      }}
                      title="Purge Report"
                    >
                      <Trash2 size={15} />
                    </button>
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
        onChange={(p) => load(p)}
      />
    </div>
  );
}

// ---------------------------------------------------------------- Audit
function AuditTab({ onError }) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [result, setResult] = useState("");

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await auditApi.list({
          page,
          limit: 50,
          action: action || undefined,
          resourceType: resourceType || undefined,
          result: result || undefined,
        });
        setRows(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
      } catch (err) {
        onError(err?.response?.data?.error?.message || "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    },
    [action, resourceType, result, onError]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div className="tl-card">
      <h2 className="tl-card-title">
        <ShieldAlert size={17} color="#10b981" />
        <span>Immutable Sovereign Audit Trail</span>
      </h2>

      <div className="tl-filters">
        <input
          type="search"
          placeholder="Filter by action (e.g. auth.login, tender.update)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
          <option value="">All resource types</option>
          {[
            "user",
            "tender",
            "company",
            "document",
            "report",
            "session",
            "review_indicator",
            "entity_match",
            "contract",
            "bid",
          ].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={result} onChange={(e) => setResult(e.target.value)}>
          <option value="">All results</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="skipped">Skipped</option>
        </select>
        <button
          className="tl-btn-ghost"
          onClick={() => load(1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="tl-table-wrap">
        <table className="tl-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Official User</th>
              <th>Action Code</th>
              <th>Target Resource</th>
              <th>Status</th>
              <th>Source IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="tl-loading">Querying immutable audit ledger…</div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="tl-empty">No audit ledger entries match criteria.</div>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontSize: 12.5, color: "var(--tl-text-muted)" }}>
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.userName || r.userEmail || "—"}</td>
                  <td>
                    <code
                      style={{
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid var(--tl-glass-border)",
                        fontSize: 12,
                        color: "#38bdf8",
                      }}
                    >
                      {r.action}
                    </code>
                  </td>
                  <td>
                    {r.resourceType ? (
                      <>
                        <span style={{ textTransform: "capitalize" }}>{r.resourceType}</span>
                        {r.resourceId && (
                          <>
                            {" · "}
                            {r.resourceType === "tender" ? (
                              <Link to={`/tenders/${r.resourceId}`}>
                                {String(r.resourceId).slice(0, 8)}…
                              </Link>
                            ) : (
                              <code style={{ fontSize: 11 }}>
                                {String(r.resourceId).slice(0, 8)}…
                              </code>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className={`tl-badge ${
                        r.result === "success"
                          ? "tl-badge-awarded"
                          : r.result === "failure"
                          ? "tl-badge-cancelled"
                          : "tl-badge-evaluation"
                      }`}
                    >
                      {r.result}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--tl-font-mono)", fontSize: 12 }}>
                    {r.ip || "—"}
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
        onChange={(p) => load(p)}
      />
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 14,
        flexWrap: "wrap",
      }}
    >
      <label
        style={{
          minWidth: 160,
          fontSize: 11.5,
          color: "var(--tl-text-dim)",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontWeight: 700,
          fontFamily: "var(--tl-font-mono)",
        }}
      >
        {label}
      </label>
      <div style={{ flex: 1, minWidth: 240 }}>{children}</div>
    </div>
  );
}
