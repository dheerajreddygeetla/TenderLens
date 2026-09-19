import { useState } from "react";

const SEVERITY_COLORS = {
  low:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  medium: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  high:   { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
};

const LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function ExplainablePanel({ indicator }) {
  const [open, setOpen] = useState(false);
  if (!indicator) return null;
  const c = SEVERITY_COLORS[indicator.severity] || SEVERITY_COLORS.medium;

  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        background: c.bg,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: c.text }}>
            Review indicator · {indicator.type}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{indicator.title}</div>
        </div>
        <span className={`tl-badge tl-badge-${indicator.severity === "high" ? "cancelled" : indicator.severity === "medium" ? "evaluation" : "open"}`}>
          {LABELS[indicator.severity]}
        </span>
      </div>

      {indicator.explanation && (
        <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.55, marginTop: 10 }}>
          {indicator.explanation}
        </p>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "transparent",
          border: 0,
          color: c.text,
          fontSize: 12.5,
          padding: 0,
          cursor: "pointer",
          marginTop: 8,
          fontFamily: "inherit",
          textDecoration: "underline",
        }}
      >
        {open ? "Hide evidence" : "Show evidence & model"}
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "#64748b", marginBottom: 4 }}>
            Evidence
          </div>
          <pre
            style={{
              background: "#0b1220",
              color: "#e2e8f0",
              padding: 12,
              borderRadius: 8,
              fontSize: 11.5,
              overflowX: "auto",
              margin: 0,
            }}
          >
{JSON.stringify(indicator.evidence || {}, null, 2)}
          </pre>

          <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
            Model: <code>{indicator.model || "—"}</code> · version <code>{indicator.modelVersion || "—"}</code> · detected{" "}
            {indicator.createdAt ? new Date(indicator.createdAt).toLocaleString() : "—"}
          </div>
        </div>
      )}
    </div>
  );
}
