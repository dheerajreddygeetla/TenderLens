export default function FullPageSpinner({ label = "Loading…" }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(1200px 600px at 20% 0%, #16244a 0%, #0b1220 45%, #070b14 100%)",
        color: "var(--tl-text-200)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 14,
            height: 14,
            border: "2px solid var(--tl-blue-400)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            animation: "tl-spin 0.9s linear infinite",
          }}
        />
        <span style={{ fontSize: 14 }}>{label}</span>
      </div>
      <style>{`@keyframes tl-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
