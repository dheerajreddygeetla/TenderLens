import { useEffect, useState } from "react";
import api from "../lib/api.js";

const shellStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background:
    "radial-gradient(1200px 600px at 20% 0%, #16244a 0%, #0b1220 45%, #070b14 100%)",
  color: "var(--tl-text-100)",
  padding: "24px",
};

const cardStyle = {
  width: "100%",
  maxWidth: "560px",
  background: "rgba(17, 26, 46, 0.85)",
  border: "1px solid var(--tl-border)",
  borderRadius: "var(--tl-radius)",
  padding: "36px",
  boxShadow: "var(--tl-shadow)",
  backdropFilter: "blur(6px)",
};

export default function Home() {
  const [apiStatus, setApiStatus] = useState("checking...");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/health")
      .then((res) => {
        if (!cancelled) setApiStatus(res.data?.data?.status ?? "ok");
      })
      .catch(() => {
        if (!cancelled) setApiStatus("unreachable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dotColor =
    apiStatus === "ok" ? "var(--tl-green)" : apiStatus === "checking..." ? "var(--tl-amber)" : "var(--tl-red)";

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #2563eb, #60a5fa)",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              color: "white",
            }}
          >
            TL
          </div>
          <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 0.4 }}>TenderLens</h1>
        </div>

        <p style={{ color: "var(--tl-text-400)", marginTop: 4, marginBottom: 28 }}>
          See Beyond the Tender — AI-Powered Procurement Intelligence.
        </p>

        <div
          style={{
            padding: "12px 14px",
            border: "1px solid var(--tl-border)",
            borderRadius: "var(--tl-radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            color: "var(--tl-text-200)",
            background: "rgba(11, 18, 32, 0.5)",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: dotColor,
              display: "inline-block",
            }}
          />
          API status: <strong style={{ color: "var(--tl-text-100)" }}>{apiStatus}</strong>
        </div>

        <p style={{ marginTop: 24, fontSize: 13, color: "var(--tl-text-400)" }}>
          Day 1 — Foundation. Login, dashboard, and procurement modules arrive in the next phases.
        </p>
      </div>
    </div>
  );
}
