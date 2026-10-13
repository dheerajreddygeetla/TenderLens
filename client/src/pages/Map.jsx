import { useEffect, useMemo, useState } from "react";
import { statsApi } from "../services/stats.js";
import ProcurementMap from "../components/map/ProcurementMap.jsx";
import Tilt3DCard from "../components/Tilt3DCard.jsx";
import {
  Compass,
  MapPin,
} from "lucide-react";

const fmtCurrency = (v) => {
  const n = Number(v) || 0;
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
};

export default function Map() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [minTenders, setMinTenders] = useState(0);
  const [onlyOpen, setOnlyOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    statsApi
      .mapData()
      .then((res) => {
        if (!cancelled) setLocations(res.data.data || []);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err?.response?.data?.error?.message || "Failed to load map data");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return locations.filter((l) => {
      if (l.tenderCount < minTenders) return false;
      if (onlyOpen && l.openCount === 0) return false;
      return true;
    });
  }, [locations, minTenders, onlyOpen]);

  const totals = useMemo(() => {
    const value = filtered.reduce((acc, l) => acc + Number(l.totalValue || 0), 0);
    const tenders = filtered.reduce((acc, l) => acc + Number(l.tenderCount || 0), 0);
    const open = filtered.reduce((acc, l) => acc + Number(l.openCount || 0), 0);
    return { value, tenders, open, count: filtered.length };
  }, [filtered]);

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontFamily: "var(--tl-font-mono)",
              color: "#38bdf8",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            <Compass size={14} />
            <span>GEOSPATIAL PROCUREMENT SURVEILLANCE</span>
          </div>
          <h1 className="tl-page-title">Tactical Procurement Map</h1>
          <p className="tl-page-sub">
            Geographic density analysis and capital distribution across sovereign jurisdictions.
          </p>
        </div>
      </div>

      {error && <div className="tl-error-bar">{error}</div>}

      {/* 3D Tilt HUD Cards */}
      <div className="tl-grid tl-grid-cols-4" style={{ marginBottom: 20 }}>
        <Tilt3DCard>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--tl-text-muted)", fontWeight: 700 }}>
            Active Jurisdictions
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "var(--tl-text-primary)" }}>
            {totals.count}
          </div>
        </Tilt3DCard>
        <Tilt3DCard>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--tl-text-muted)", fontWeight: 700 }}>
            Geocoded Tenders
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "var(--tl-text-primary)" }}>
            {totals.tenders}
          </div>
        </Tilt3DCard>
        <Tilt3DCard>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, color: "#38bdf8", fontWeight: 700 }}>
            Open Submissions
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#38bdf8" }}>
            {totals.open}
          </div>
        </Tilt3DCard>
        <Tilt3DCard>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, color: "#34d399", fontWeight: 700 }}>
            Regional Capital Value
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: "#34d399" }}>
            {fmtCurrency(totals.value)}
          </div>
        </Tilt3DCard>
      </div>

      {/* Filter HUD */}
      <div className="tl-filters" style={{ marginBottom: 18 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "var(--tl-text-secondary)",
          }}
        >
          <span>Threshold minimum tenders:</span>
          <input
            type="number"
            min={0}
            value={minTenders}
            onChange={(e) => setMinTenders(Number(e.target.value))}
            className="tl-input-like"
            style={{ width: 80 }}
          />
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--tl-text-secondary)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
          />
          <span>Filter active submission windows only</span>
        </label>
      </div>

      {/* Map Canvas Container */}
      <div
        className="tl-card"
        style={{
          padding: 0,
          overflow: "hidden",
          borderRadius: "var(--tl-radius)",
          border: "1px solid var(--tl-glass-border)",
          boxShadow: "var(--tl-glass-shadow)",
        }}
      >
        {loading ? (
          <div className="tl-loading" style={{ height: 640 }}>
            Loading tactical GIS raster layers…
          </div>
        ) : (
          <ProcurementMap locations={filtered} onSelect={setSelected} height={640} />
        )}
      </div>

      {selected && (
        <div className="tl-card" style={{ marginTop: 20 }}>
          <h2 className="tl-card-title">
            <MapPin size={17} color="#38bdf8" />
            <span>
              {selected.name}
              {selected.state ? `, ${selected.state}` : ""}
            </span>
          </h2>
          <div className="tl-grid tl-grid-cols-4">
            <Info label="Tenders Hosted" value={selected.tenderCount} />
            <Info label="Open for Bidding" value={selected.openCount} />
            <Info label="Regional Expenditure" value={fmtCurrency(selected.totalValue)} />
            <Info
              label="Coordinates"
              value={`${selected.lat?.toFixed(3)}, ${selected.lng?.toFixed(3)}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color: "var(--tl-text-dim)",
          fontWeight: 700,
          fontFamily: "var(--tl-font-mono)",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16, marginTop: 4, fontWeight: 700, color: "var(--tl-text-primary)" }}>
        {value}
      </div>
    </div>
  );
}
