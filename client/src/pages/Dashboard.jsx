import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { statsApi } from "../services/stats.js";
import { useAuth } from "../hooks/useAuth.js";
import Tilt3DCard from "../components/Tilt3DCard.jsx";
import BarChartCard from "../components/charts/BarChartCard.jsx";
import PieChartCard from "../components/charts/PieChartCard.jsx";
import LineChartCard from "../components/charts/LineChartCard.jsx";
import {
  FileSpreadsheet,
  Coins,
  FileCheck,
  FolderArchive,
  Building2,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  BrainCircuit,
  Network,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [overTime, setOverTime] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([statsApi.summary(), statsApi.tendersOverTime()])
      .then(([s, o]) => {
        if (cancelled) return;
        setSummary(s.data.data);
        setOverTime(o.data.data || []);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err?.response?.data?.error?.message || "Failed to load executive summary");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = summary?.totals || {};
  const byDepartment = summary?.byDepartment || [];
  const byStatus = summary?.byStatus || [];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {/* Executive Command Header */}
      <div className="tl-page-header">
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              fontFamily: "var(--tl-font-mono)",
              color: "#38bdf8",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            <Activity size={14} />
            <span>REAL-TIME EXECUTIVE SURVEILLANCE MATRIX</span>
          </div>
          <h1 className="tl-page-title">
            {greeting}, {user?.fullName?.split(" ")[0] || "Director"}
          </h1>
          <p className="tl-page-sub">
            Sovereign Procurement Surveillance &amp; AI Collusion Detection —{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            to="/analysis"
            className="tl-btn"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #2563eb)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BrainCircuit size={16} />
            <span>Launch Neural Analysis</span>
          </Link>
          <Link
            to="/risks"
            className="tl-btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <ShieldAlert size={16} color="#f59e0b" />
            <span>Risk Center</span>
          </Link>
        </div>
      </div>

      {error && <div className="tl-error-bar">{error}</div>}

      {/* Real-time Threat Ticker / Collusion Alert Banner */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          borderRadius: "var(--tl-radius)",
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
          boxShadow: "0 8px 30px rgba(239, 68, 68, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              display: "grid",
              placeItems: "center",
              color: "#f87171",
              boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)",
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#ffffff" }}>
              Active Anomaly Surveillance Mode: Armed &amp; Monitoring
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Benford analysis, cartel graph clustering, and document text-similarity pipelines are
              actively screening incoming vendor submissions.
            </div>
          </div>
        </div>

        <Link
          to="/risks"
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "#fca5a5",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            padding: "8px 14px",
            borderRadius: 8,
            transition: "all 0.2s ease",
          }}
        >
          <span>Investigate Indicators</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* 3D Tilt KPI Matrix */}
      <div className="tl-grid tl-grid-cols-4" style={{ marginBottom: 24 }}>
        <Tilt3DCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--tl-text-muted)" }}>
              Total Tenders
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa" }}>
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: -0.5, color: "var(--tl-text-primary)" }}>
            {totals.total_tenders ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "#34d399", marginTop: 6, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
            <TrendingUp size={13} />
            <span>Monitored in registry</span>
          </div>
        </Tilt3DCard>

        <Tilt3DCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--tl-text-muted)" }}>
              Open for Bidding
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: "rgba(6, 182, 212, 0.12)", color: "#22d3ee" }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: -0.5, color: "#38bdf8" }}>
            {totals.open_tenders ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--tl-text-muted)", marginTop: 6, fontWeight: 500 }}>
            Live submission window
          </div>
        </Tilt3DCard>

        <Tilt3DCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--tl-text-muted)" }}>
              Contracts Awarded
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", color: "#34d399" }}>
              <FileCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: -0.5, color: "#34d399" }}>
            {totals.awarded_tenders ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--tl-text-muted)", marginTop: 6, fontWeight: 500 }}>
            Post-evaluation awards
          </div>
        </Tilt3DCard>

        <Tilt3DCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--tl-text-muted)" }}>
              Completed &amp; Closed
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: "rgba(100, 116, 139, 0.15)", color: "#94a3b8" }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: -0.5, color: "var(--tl-text-primary)" }}>
            {totals.completed_tenders ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--tl-text-muted)", marginTop: 6, fontWeight: 500 }}>
            Archived executions
          </div>
        </Tilt3DCard>

        <Tilt3DCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--tl-text-muted)" }}>
              Registered Companies
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: "rgba(139, 92, 246, 0.12)", color: "#a78bfa" }}>
              <Building2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: -0.5, color: "var(--tl-text-primary)" }}>
            {totals.total_companies ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--tl-text-muted)", marginTop: 6, fontWeight: 500 }}>
            Tracked contractor entities
          </div>
        </Tilt3DCard>

        <Tilt3DCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--tl-text-muted)" }}>
              Active Contracts
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24" }}>
              <FileCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: -0.5, color: "#fbbf24" }}>
            {totals.total_contracts ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--tl-text-muted)", marginTop: 6, fontWeight: 500 }}>
            Binding commitments
          </div>
        </Tilt3DCard>

        <Tilt3DCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--tl-text-muted)" }}>
              Total Bids Evaluated
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa" }}>
              <Coins size={16} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: -0.5, color: "var(--tl-text-primary)" }}>
            {totals.total_bids ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--tl-text-muted)", marginTop: 6, fontWeight: 500 }}>
            Price submittals audited
          </div>
        </Tilt3DCard>

        <Tilt3DCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--tl-text-muted)" }}>
              Audited Documents
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: "rgba(6, 182, 212, 0.12)", color: "#22d3ee" }}>
              <FolderArchive size={16} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: -0.5, color: "var(--tl-text-primary)" }}>
            {totals.total_documents ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--tl-text-muted)", marginTop: 6, fontWeight: 500 }}>
            Full-text forensic indexes
          </div>
        </Tilt3DCard>
      </div>

      {/* Cybernetic Glass Charts Section */}
      <div className="tl-grid tl-grid-cols-2" style={{ marginBottom: 24 }}>
        <LineChartCard
          title="Procurement Velocity (Last 12 Months)"
          data={overTime}
          dataKey="count"
          xKey="month"
        />
        <PieChartCard
          title="Tender Status Distribution Matrix"
          data={byStatus}
          dataKey="count"
          nameKey="status"
        />
      </div>

      <div className="tl-grid tl-grid-cols-2" style={{ marginBottom: 24 }}>
        <BarChartCard
          title="Tender Count by Ministry / Department"
          data={byDepartment}
          dataKey="count"
          xKey="name"
        />
        <BarChartCard
          title="Total Capital Expenditure by Department"
          data={byDepartment}
          dataKey="value"
          xKey="name"
          valueFormat="currency"
        />
      </div>

      {/* Executive Quick Command Matrix */}
      <div className="tl-card" style={{ marginTop: 24 }}>
        <h2 className="tl-card-title">
          <Sparkles size={17} color="#38bdf8" />
          <span>Executive Command Shortcuts</span>
        </h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link
            to="/tenders"
            className="tl-btn"
            style={{ width: "auto", display: "inline-flex", textDecoration: "none" }}
          >
            <FileSpreadsheet size={15} />
            <span>Tender Registry</span>
          </Link>
          <Link
            to="/bids"
            className="tl-btn-ghost"
            style={{ textDecoration: "none", display: "inline-flex", gap: 8, alignItems: "center" }}
          >
            <Coins size={15} />
            <span>Bids &amp; Pricing Matrix</span>
          </Link>
          <Link
            to="/graph"
            className="tl-btn-ghost"
            style={{ textDecoration: "none", display: "inline-flex", gap: 8, alignItems: "center" }}
          >
            <Network size={15} />
            <span>Cartel Entity Graph</span>
          </Link>
          <Link
            to="/contracts"
            className="tl-btn-ghost"
            style={{ textDecoration: "none", display: "inline-flex", gap: 8, alignItems: "center" }}
          >
            <FileCheck size={15} />
            <span>Contract Awards</span>
          </Link>
          <Link
            to="/reports"
            className="tl-btn-ghost"
            style={{ textDecoration: "none", display: "inline-flex", gap: 8, alignItems: "center" }}
          >
            <FolderArchive size={15} />
            <span>Audit Reports &amp; Exports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
