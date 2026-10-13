import { useState } from "react";
import { ShieldAlert, ChevronDown, ChevronUp, Cpu, Calendar } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

const SEVERITY_THEMES = {
  low: {
    border: "rgba(59, 130, 246, 0.4)",
    glow: "rgba(59, 130, 246, 0.1)",
    tag: "#60a5fa",
  },
  medium: {
    border: "rgba(245, 158, 11, 0.45)",
    glow: "rgba(245, 158, 11, 0.12)",
    tag: "#fbbf24",
  },
  high: {
    border: "rgba(239, 68, 68, 0.5)",
    glow: "rgba(239, 68, 68, 0.15)",
    tag: "#f87171",
  },
};

export default function ExplainablePanel({ indicator }) {
  const [open, setOpen] = useState(false);
  if (!indicator) return null;
  const theme = SEVERITY_THEMES[indicator.severity] || SEVERITY_THEMES.medium;

  return (
    <div
      style={{
        border: `1px solid ${theme.border}`,
        background: "var(--tl-surface-card)",
        backdropFilter: "var(--tl-glass-blur)",
        boxShadow: `0 8px 30px ${theme.glow}`,
        borderRadius: "var(--tl-radius)",
        padding: 20,
        marginBottom: 16,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div
            style={{
              fontSize: 10.5,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: theme.tag,
              fontWeight: 700,
              fontFamily: "var(--tl-font-mono)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ShieldAlert size={14} />
            <span>AI Risk Indicator · {indicator.type}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, color: "var(--tl-text-primary)" }}>
            {indicator.title}
          </div>
        </div>
        <StatusBadge status={indicator.severity} />
      </div>

      {indicator.explanation && (
        <p
          style={{
            fontSize: 13.5,
            color: "var(--tl-text-secondary)",
            lineHeight: 1.6,
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          {indicator.explanation}
        </p>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid var(--tl-glass-border)",
          color: "var(--tl-text-primary)",
          fontSize: 12,
          fontWeight: 600,
          padding: "6px 12px",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 10,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "inherit",
          transition: "all 0.2s ease",
        }}
      >
        <span>{open ? "Hide Forensic Evidence" : "Inspect Forensic Evidence & Model Weights"}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 10.5,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--tl-text-dim)",
              fontWeight: 700,
              fontFamily: "var(--tl-font-mono)",
              marginBottom: 6,
            }}
          >
            JSON Raw Telemetry Evidence:
          </div>
          <pre
            style={{
              background: "rgba(3, 6, 17, 0.85)",
              color: "#38bdf8",
              padding: 14,
              borderRadius: 10,
              border: "1px solid var(--tl-glass-border)",
              fontSize: 12,
              fontFamily: "var(--tl-font-mono)",
              overflowX: "auto",
              margin: 0,
            }}
          >
            {JSON.stringify(indicator.evidence || {}, null, 2)}
          </pre>

          <div
            style={{
              fontSize: 11,
              color: "var(--tl-text-dim)",
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Cpu size={13} />
              <span>
                Model: <strong>{indicator.model || "heuristic-v2"}</strong> (v{indicator.modelVersion || "1.0"})
              </span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={13} />
              <span>
                Flagged: {indicator.createdAt ? new Date(indicator.createdAt).toLocaleString() : "—"}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
