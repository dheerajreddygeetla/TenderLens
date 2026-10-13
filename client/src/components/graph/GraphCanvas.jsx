import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

const COLORS = {
  Company:    "#2563eb",
  Tender:     "#10b981",
  Contract:   "#f59e0b",
  Department: "#8b5cf6",
  Location:   "#ef4444",
};

const SIZE = (kind) =>
  kind === "Tender" ? 5 : kind === "Company" ? 6 : kind === "Contract" ? 5 : 4;

export default function GraphCanvas({ data, onNodeClick, height = 620 }) {
  const wrapRef = useRef(null);
  const fgRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: height });

  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver(() => {
      if (wrapRef.current) {
        setSize({ w: wrapRef.current.clientWidth, h: height });
      }
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, [height]);

  useEffect(() => {
    if (fgRef.current && data?.nodes?.length) {
      // Auto-fit after layout settles
      setTimeout(() => fgRef.current?.zoomToFit(400, 60), 600);
    }
  }, [data]);

  const graphData = useMemo(
    () => ({
      nodes: (data?.nodes || []).map((n) => ({ ...n })),
      links: (data?.links || []).map((l) => ({ ...l })),
    }),
    [data]
  );

  return (
    <div ref={wrapRef} style={{ width: "100%", height, background: "#0b1220", borderRadius: 10, overflow: "hidden" }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={size.w}
        height={size.h}
        backgroundColor="#0b1220"
        nodeRelSize={5}
        linkColor={() => "rgba(148, 163, 184, 0.35)"}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={0.85}
        linkWidth={1}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label || node.id;
          const r = SIZE(node.kind);
          const color = COLORS[node.kind] || "#94a3b8";
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fill();
          if (globalScale > 0.9) {
            const fontSize = Math.max(9, 12 / globalScale);
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = "#e2e8f0";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            const short = label.length > 28 ? label.slice(0, 26) + "…" : label;
            ctx.fillText(short, node.x, node.y + r + 2);
          }
        }}
        onNodeClick={(node) => onNodeClick?.(node)}
        cooldownTicks={200}
      />
    </div>
  );
}
