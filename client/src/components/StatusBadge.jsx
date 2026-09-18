const LABELS = {
  open: "Open",
  evaluation: "Evaluation",
  awarded: "Awarded",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase();
  const cls = `tl-badge tl-badge-${key}`;
  return <span className={cls}>{LABELS[key] || status || "—"}</span>;
}
