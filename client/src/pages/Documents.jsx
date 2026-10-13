import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { documentApi } from "../services/document.js";
import Pagination from "../components/Pagination.jsx";
import { formatDateTime } from "../utils/format.js";
import { useAuth } from "../hooks/useAuth.js";
import {
  UploadCloud,
  FolderArchive,
  Search,
  RotateCcw,
  Trash2,
  FileText,
  CheckCircle2,
} from "lucide-react";

const STATUSES = ["uploaded", "processing", "processed", "failed"];

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

export default function Documents() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 20);
  const status = params.get("status") || "";
  const search = params.get("search") || "";

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [searchInput, setSearchInput] = useState(search);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => setSearchInput(search), [search]);

  const load = () => {
    setLoading(true);
    setError("");
    documentApi
      .list({ page, limit, status: status || undefined, search: search || undefined })
      .then((res) => {
        setRows(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit, total: 0, totalPages: 1 });
      })
      .catch((err) => setError(err?.response?.data?.error?.message || "Failed to load documents"))
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

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    setInfo("");
    try {
      const res = await documentApi.upload(file);
      const data = res.data?.data;
      setInfo(
        data?.isDuplicate
          ? `Uploaded ${file.name} (duplicate index identified, stored as discrete audit entry).`
          : `Ingested ${file.name} successfully into full-text forensic vault.`
      );
      load();
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  };

  const canUpload = user?.permissions?.includes("document:upload");
  const canDelete = user?.permissions?.includes("document:delete");

  const onDelete = async (id) => {
    if (!window.confirm("Permanently purge this document from the vault?")) return;
    try {
      await documentApi.remove(id);
      load();
    } catch (err) {
      alert(err?.response?.data?.error?.message || "Delete failed");
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
            <FolderArchive size={14} />
            <span>FULL-TEXT FORENSIC REPOSITORY</span>
          </div>
          <h1 className="tl-page-title">Procurement Document Vault</h1>
          <p className="tl-page-sub">
            Forensic NLP analysis, text similarity scanning, and contract specifications vault.
          </p>
        </div>
      </div>

      {canUpload && (
        <div
          className="tl-card"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            marginBottom: 20,
            border: dragOver
              ? "1.5px dashed #38bdf8"
              : "1.5px dashed var(--tl-glass-border-bright)",
            background: dragOver ? "rgba(59, 130, 246, 0.15)" : "var(--tl-surface-card)",
            backdropFilter: "var(--tl-glass-blur)",
            textAlign: "center",
            padding: 36,
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud
            size={40}
            color={dragOver ? "#38bdf8" : "#60a5fa"}
            style={{ marginBottom: 12 }}
          />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tl-text-primary)" }}>
            {uploading ? "Ingesting Document & Extracting NLP Tokens…" : "Upload Procurement Specification / Bid Document"}
          </div>
          <div style={{ fontSize: 13, color: "var(--tl-text-muted)", marginTop: 4 }}>
            Drag and drop forensic PDF, DOCX, or XLSX here, or click to browse (Max 25 MB)
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={(e) => uploadFile(e.target.files?.[0])}
          />
        </div>
      )}

      {error && <div className="tl-error-bar">{error}</div>}
      {info && (
        <div
          className="tl-card"
          style={{
            marginBottom: 16,
            borderColor: "rgba(16, 185, 129, 0.4)",
            background: "rgba(16, 185, 129, 0.08)",
            color: "#6ee7b7",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{info}</span>
        </div>
      )}

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
            placeholder="Search document name, SHA-256 hash…"
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
          <option value="">All processing states</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
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

      <div className="tl-table-wrap">
        <table className="tl-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Format</th>
              <th>Size</th>
              <th>Processing State</th>
              <th>OCR Pages</th>
              <th>Ingestion Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="tl-loading">Querying document repository…</div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="tl-empty">No documents match the search criteria.</div>
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} color="#38bdf8" />
                      <span style={{ fontWeight: 600 }}>{d.originalName}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(59, 130, 246, 0.12)",
                        color: "#60a5fa",
                        fontSize: 11,
                        fontFamily: "var(--tl-font-mono)",
                        fontWeight: 700,
                      }}
                    >
                      {d.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--tl-font-mono)", fontSize: 12 }}>
                    {humanBytes(d.sizeBytes)}
                  </td>
                  <td>
                    <span
                      className={`tl-badge ${
                        d.status === "processed"
                          ? "tl-badge-awarded"
                          : d.status === "failed"
                          ? "tl-badge-cancelled"
                          : "tl-badge-open"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td>{d.pageCount ?? "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--tl-text-muted)" }}>
                    {formatDateTime(d.createdAt)}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {canDelete && (
                      <button
                        onClick={() => onDelete(d.id)}
                        style={{
                          background: "transparent",
                          border: 0,
                          color: "#f87171",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          padding: 4,
                        }}
                        title="Delete Document"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
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
