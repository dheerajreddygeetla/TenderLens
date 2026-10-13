import { useEffect } from "react";
import { MapContainer, Popup, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { Link } from "react-router-dom";

const fmtCurrency = (v) => {
  const n = Number(v) || 0;
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

// Fit bounds to markers once they load
function FitToMarkers({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || !points.length) return;
    const bounds = points.map((p) => [p.lat, p.lng]);
    try {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });
    } catch { /* ignore */ }
  }, [points, map]);
  return null;
}

const radiusFor = (count) => {
  const n = Number(count) || 0;
  if (n === 0) return 6;
  return Math.min(30, 6 + Math.sqrt(n) * 3);
};

export default function ProcurementMap({ locations = [], height = 640, onSelect }) {
  const center = locations.length
    ? [locations[0].lat, locations[0].lng]
    : [20.5937, 78.9629]; // India center fallback

  return (
    <div style={{ width: "100%", height, borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <MapContainer
        center={center}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToMarkers points={locations} />

        {locations.map((l) => (
          <CircleMarker
            key={l.id}
            center={[l.lat, l.lng]}
            radius={radiusFor(l.tenderCount)}
            pathOptions={{
              color: l.openCount > 0 ? "#2563eb" : "#10b981",
              fillColor: l.openCount > 0 ? "#3b82f6" : "#34d399",
              fillOpacity: 0.5,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onSelect?.(l),
            }}
          >
            <Popup>
              <div style={{ fontSize: 13, minWidth: 220 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {l.name}{l.state ? `, ${l.state}` : ""}
                </div>
                <div style={{ marginBottom: 6, color: "#64748b", fontSize: 12 }}>
                  {l.country || "—"}
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                  <div>Tenders: <strong>{l.tenderCount}</strong></div>
                  <div>Open: <strong>{l.openCount}</strong></div>
                  <div>Total value: <strong>{fmtCurrency(l.totalValue)}</strong></div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Link to={`/tenders?search=${encodeURIComponent(l.name)}`} style={{ fontSize: 12 }}>
                    View tenders →
                  </Link>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
