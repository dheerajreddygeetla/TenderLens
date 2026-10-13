import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { reviewApi } from "../services/review.js";
import ExplainablePanel from "../components/ExplainablePanel.jsx";
import { formatDateTime } from "../utils/format.js";
import { useAuth } from "../hooks/useAuth.js";

const STATUSES = ["new", "under_review", "resolved", "dismissed"];

export default function RiskDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [indicator, setIndicator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    reviewApi.get(id)
      .then((res) => setIndicator(res.data.data))
      .catch((err) => setError(err?.response?.data?.error?.message || "Failed to load indicator"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const changeStatus = async (status) => {
    setBusy(true);
    try {
      const res = await reviewApi.updateStatus(id, { status });
      setIndicator(res.data.data);
    } catch (err) {
      alert(err?.response?.data?.error?.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const addNote = async () => {
    if (!noteBody.trim()) return;
    setBusy(true);
    try {
      const res = await reviewApi.addNote(id, noteBody.trim());
      setIndicator(res.data.data);
      setNoteBody("");
    } catch (err) {
      alert(err?.response?.data?.error?.message || "Failed to add note");
    } finally {
      setBusy(false);
    }
  };

  const canUpdate = user?.permissions?.includes("risk:update");

  if (loading) return <div className="tl-loading">Loading indicator…</div>;
  if (error) return <div className="tl-error-bar">{error}</div>;
  if (!indicator) return null;

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <p className="tl-page-sub" style={{ marginBottom: 2 }}>
            <Link to="/risks">← Back to Risk Center</Link>
          </p>
          <h1 className="tl-page-title">{indicator.title}</h1>
          <p className="tl-page-sub">
            {indicator.type} · Severity <strong>{indicator.severity}</strong> · Status <strong>{indicator.status}</strong>
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <ExplainablePanel indicator={indicator} />
      </div>

      <div className="tl-card" style={{ marginBottom: 16 }}>
        <h2 className="tl-card-title">Context</h2>
        <div className="tl-grid tl-grid-cols-4">
          <Info label="Tender" value={indicator.tenderCode ? <Link to={`/tenders/${indicator.tenderId}`}>{indicator.tenderCode}</Link> : "—"} />
          <Info label="Company" value={indicator.companyName || "—"} />
          <Info label="Document" value={indicator.documentId ? indicator.documentId.slice(0, 8) + "…" : "—"} />
          <Info label="Detected" value={formatDateTime(indicator.createdAt)} />
        </div>
      </div>

      {canUpdate && (
        <div className="tl-card" style={{ marginBottom: 16 }}>
          <h2 className="tl-card-title">Update status</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={busy || indicator.status === s}
                onClick={() => changeStatus(s)}
                className="tl-btn-ghost"
                style={{
                  border: "1px solid #e2e8f0",
                  background: indicator.status === s ? "#eff6ff" : "#fff",
                  color: indicator.status === s ? "#1d4ed8" : "#334155",
                  padding: "6px 12px", borderRadius: 8, fontSize: 13,
                  cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="tl-card">
        <h2 className="tl-card-title">Reviewer Notes</h2>
        {(indicator.notes || []).length === 0 ? (
          <div className="tl-empty">No notes yet.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {indicator.notes.map((n) => (
              <li key={n.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <div style={{ fontSize: 11.5, color: "#64748b" }}>
                  {n.authorName || "—"} · {formatDateTime(n.createdAt)}
                </div>
                <div style={{ marginTop: 4 }}>{n.body}</div>
              </li>
            ))}
          </ul>
        )}

        {canUpdate && (
          <div style={{ marginTop: 14 }}>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Add a note for reviewers…"
              rows={3}
              style={{ width: "100%", padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical" }}
            />
            <div style={{ marginTop: 8 }}>
              <button className="tl-btn" style={{ width: "auto" }} onClick={addNote} disabled={busy || !noteBody.trim()}>
                {busy ? "Saving…" : "Add note"}
              </button>
            </div>
          </div>
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
