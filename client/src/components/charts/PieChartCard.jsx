import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "#3b82f6", // Blue - Open
  "#f59e0b", // Amber - Evaluation
  "#10b981", // Emerald - Awarded
  "#64748b", // Slate - Completed
  "#ef4444", // Red - Cancelled
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div
        style={{
          background: "rgba(10, 17, 36, 0.92)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(59, 130, 246, 0.4)",
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          color: "#f8fafc",
          fontSize: "12px",
        }}
      >
        <div style={{ color: "#94a3b8", fontWeight: 600, textTransform: "capitalize" }}>
          {data.name}
        </div>
        <div style={{ color: data.payload.fill || "#38bdf8", fontWeight: 700, fontSize: "14px" }}>
          {data.value} tenders
        </div>
      </div>
    );
  }
  return null;
};

export default function PieChartCard({
  title,
  data,
  dataKey = "count",
  nameKey = "status",
  height = 270,
}) {
  return (
    <div className="tl-card">
      <h2 className="tl-card-title">{title}</h2>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              stroke="rgba(12, 20, 43, 0.8)"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--tl-text-muted)" }}
              formatter={(val) => <span style={{ textTransform: "capitalize" }}>{val}</span>}
            />
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
