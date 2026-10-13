import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const fmtShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${v}`;
};

const CustomTooltip = ({ active, payload, label, valueFormat }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
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
          {valueFormat === "currency" ? fmtShort(val) : val?.toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
};

export default function BarChartCard({
  title,
  data,
  dataKey = "count",
  xKey = "name",
  height = 270,
  valueFormat = "number",
}) {
  return (
    <div className="tl-card">
      <h2 className="tl-card-title">{title}</h2>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "var(--tl-text-muted)" }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={56}
              stroke="rgba(148, 163, 184, 0.2)"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--tl-text-muted)" }}
              tickFormatter={valueFormat === "currency" ? fmtShort : undefined}
              stroke="rgba(148, 163, 184, 0.2)"
            />
            <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} />
            <Bar
              dataKey={dataKey}
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
