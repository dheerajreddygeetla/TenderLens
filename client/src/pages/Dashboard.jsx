import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";

const card = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: 18,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const kpiCard = (label, value, sub) => (
  <div style={card}>
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b" }}>
      {label}
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/stats/summary")
      .then((res) => {
        if (!cancelled) setSummary(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.error?.message || "Failed to load summary");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = summary?.totals || {};
  const byDepartment = summary?.byDepartment || [];
  const byStatus = summary?.byStatus || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <h1 className="tl-page-title">
            {greeting}, {user?.fullName?.split(" ")[0] || "user"}
          </h1>
          <p className="tl-page-sub">
            Procurement Intelligence Overview — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {error && <div className="tl-error-bar">{error}</div>}

      <div className="tl-grid tl-grid-cols-4" style={{ marginBottom: 16 }}>
        {kpiCard("Total Tenders", totals.total_tenders ?? "—")}
        {kpiCard("Open Tenders", totals.open_tenders ?? "—")}
        {kpiCard("Awarded", totals.awarded_tenders ?? "—")}
        {kpiCard("Completed", totals.completed_tenders ?? "—")}
        {kpiCard("Companies", totals.total_companies ?? "—")}
        {kpiCard("Departments", totals.total_departments ?? "—")}
        {kpiCard("Locations", totals.total_locations ?? "—")}
        {kpiCard("Review Indicators", "—", "Coming Day 9")}
      </div>

      <div className="tl-grid tl-grid-cols-2">
        <div style={card}>
          <h2 className="tl-card-title">Tenders by Department</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13.5 }}>
            {byDepartment.map((d) => (
              <li
                key={d.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span>{d.name}</span>
                <strong>{d.count}</strong>
              </li>
            ))}
            {byDepartment.length === 0 && <div className="tl-empty">No data yet.</div>}
          </ul>
        </div>

        <div style={card}>
          <h2 className="tl-card-title">Tenders by Status</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13.5 }}>
            {byStatus.map((s) => (
              <li
                key={s.status}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f5f9",
                  textTransform: "capitalize",
                }}
              >
                <span>{s.status}</span>
                <strong>{s.count}</strong>
              </li>
            ))}
            {byStatus.length === 0 && <div className="tl-empty">No data yet.</div>}
          </ul>
        </div>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h2 className="tl-card-title">Quick Actions</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/tenders" className="tl-btn" style={{ width: "auto", display: "inline-block", textDecoration: "none" }}>
            Browse Tenders
          </Link>
          <Link to="/companies" className="tl-btn-ghost" style={{ textDecoration: "none" }}>
            View Companies
          </Link>
        </div>
      </div>
    </div>
  );
}
