import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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
        <div style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "14px" }}>
          Volume: {payload[0].value} tenders
        </div>
      </div>
    );
  }
  return null;
};

export default function LineChartCard({
  title,
  data,
  dataKey = "count",
  xKey = "month",
  height = 270,
}) {
  return (
    <div className="tl-card">
      <h2 className="tl-card-title">{title}</h2>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "var(--tl-text-muted)" }}
              stroke="rgba(148, 163, 184, 0.2)"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--tl-text-muted)" }}
              stroke="rgba(148, 163, 184, 0.2)"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ r: 4, fill: "#0891b2", stroke: "#cffafe", strokeWidth: 2 }}
              activeDot={{ r: 7, fill: "#22d3ee", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
