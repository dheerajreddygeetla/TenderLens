import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { companyApi } from "../services/company.js";
import { formatDate } from "../utils/format.js";

const TABS = ["Overview", "Tenders", "Contracts", "Relationships", "Timeline"];

export default function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    companyApi
      .get(id)
      .then((res) => {
        if (cancelled) return;
        setCompany(res.data.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.error?.message || "Failed to load company");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="tl-loading">Loading company…</div>;
  if (error) return <div className="tl-error-bar">{error}</div>;
  if (!company) return null;

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <p className="tl-page-sub" style={{ marginBottom: 2 }}>
            <Link to="/companies">← Back to Companies</Link>
          </p>
          <h1 className="tl-page-title">{company.name}</h1>
          <p className="tl-page-sub">{company.industry || "—"}</p>
        </div>
      </div>

      <div className="tl-card" style={{ marginBottom: 16 }}>
        <div className="tl-grid tl-grid-cols-4">
          <Info label="Registration ID" value={company.registrationId || "—"} />
          <Info label="Industry" value={company.industry || "—"} />
          <Info label="Location" value={company.locationName ? `${company.locationName}, ${company.locationState || ""}` : "—"} />
          <Info label="Registered" value={formatDate(company.createdAt)} />
        </div>
      </div>

      <div className="tl-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
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
        <div className="tl-empty">
          {tab} data will populate once the bids, contracts, and graph modules arrive (Day 4+).
        </div>
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
