const LABELS = {
  open: "Open",
  evaluation: "Evaluation",
  awarded: "Awarded",
  completed: "Completed",
  cancelled: "Cancelled",
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  critical: "Critical Anomaly",
};

export default function StatusBadge({ status, className = "" }) {
  const key = String(status || "").toLowerCase();
  const cls = `tl-badge tl-badge-${key} ${className}`;
  return (
    <span className={cls}>
      <span className="tl-badge-dot" />
      <span>{LABELS[key] || status || "—"}</span>
    </span>
  );
}
