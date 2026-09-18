import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { tenderApi } from "../services/tender.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatCurrency, formatDate, formatDateTime } from "../utils/format.js";
import { useAuth } from "../hooks/useAuth.js";

const TABS = ["Overview", "Documents", "Bids", "Timeline", "Companies", "AI Analysis", "Contracts", "Audit"];

export default function TenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    tenderApi
      .get(id)
      .then((res) => {
        if (cancelled) return;
        setTender(res.data.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.error?.message || "Failed to load tender");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  const canDelete = user?.permissions?.includes("tender:delete");

  const onDelete = async () => {
    if (!window.confirm("Delete this tender? This cannot be undone.")) return;
    try {
      await tenderApi.remove(id);
      navigate("/tenders", { replace: true });
    } catch (err) {
      alert(err?.response?.data?.error?.message || "Delete failed");
    }
  };

  if (loading) return <div className="tl-loading">Loading tender…</div>;
  if (error) return <div className="tl-error-bar">{error}</div>;
  if (!tender) return null;

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <p className="tl-page-sub" style={{ marginBottom: 2 }}>
            <Link to="/tenders">← Back to Tenders</Link>
          </p>
          <h1 className="tl-page-title">
            {tender.tenderCode} <StatusBadge status={tender.status} />
          </h1>
          <p className="tl-page-sub">{tender.title}</p>
        </div>
        {canDelete && (
          <button className="tl-btn" style={{ width: "auto", background: "#b91c1c" }} onClick={onDelete}>
            Delete
          </button>
        )}
      </div>

      <div className="tl-card" style={{ marginBottom: 16 }}>
        <div className="tl-grid tl-grid-cols-4">
          <Info label="Department" value={tender.departmentName || "—"} />
          <Info label="Location" value={tender.locationName ? `${tender.locationName}, ${tender.locationState || ""}` : "—"} />
          <Info label="Estimated Value" value={formatCurrency(tender.estimatedValue, tender.currency)} />
          <Info label="Project" value={tender.projectName || "—"} />
          <Info label="Published" value={formatDateTime(tender.publishedAt)} />
          <Info label="Deadline" value={formatDateTime(tender.deadlineAt)} />
          <Info label="Currency" value={tender.currency || "—"} />
          <Info label="Created" value={formatDate(tender.createdAt)} />
        </div>
      </div>

      <div className="tl-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tl-btn-ghost ${tab === t ? "tl-active-tab" : ""}`}
              style={{
                border: "1px solid #e2e8f0",
                background: tab === t ? "#eff6ff" : "#fff",
                color: tab === t ? "#1d4ed8" : "#334155",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="tl-card">
        <h2 className="tl-card-title">{tab}</h2>
        {tab === "Overview" && (
          <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.6 }}>
            {tender.description || "No description provided."}
          </p>
        )}
        {tab !== "Overview" && (
          <div className="tl-empty">
            {tab} will be available in a later phase (Day 4+).
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "#64748b" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, marginTop: 4, fontWeight: 500 }}>{value}</div>
    </div>
  );
}
