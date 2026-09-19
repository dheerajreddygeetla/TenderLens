export default function DocumentSimilarityList({ indicators = [] }) {
  const sims = indicators.filter((i) => i.type === "Document Similarity");
  if (!sims.length) {
    return (
      <div className="tl-empty" style={{ textAlign: "left", padding: 0 }}>
        No document similarity indicators detected for this tender.
      </div>
    );
  }

  return (
    <div>
      {sims.map((i) => {
        const sim = i.evidence?.similarity ?? 0;
        const pct = Math.round(sim * 100);
        return (
          <div
            key={i.id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                minWidth: 60,
                textAlign: "center",
                fontWeight: 700,
                color: pct >= 95 ? "#991b1b" : pct >= 85 ? "#92400e" : "#334155",
              }}
            >
              {pct}%
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{i.title}</div>
              <div style={{ fontSize: 11.5, color: "#64748b" }}>
                {i.evidence?.sourceDocumentName || "—"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
