import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api.js";
import Executive3DScene from "../components/Executive3DScene.jsx";
import Tilt3DCard from "../components/Tilt3DCard.jsx";
import {
  ShieldAlert,
  BrainCircuit,
  Network,
  FileCheck2,
  ArrowRight,
  Terminal,
  FileSpreadsheet,
  Award,
  Fingerprint,
} from "lucide-react";

export default function Home() {
  const [apiStatus, setApiStatus] = useState("checking...");
  const [latency, setLatency] = useState(18);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    api
      .get("/health")
      .then((res) => {
        if (!cancelled) {
          setApiStatus(res.data?.data?.status ?? "ok");
          setLatency(Date.now() - start);
        }
      })
      .catch(() => {
        if (!cancelled) setApiStatus("unreachable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dotColor =
    apiStatus === "ok" ? "#10b981" : apiStatus === "checking..." ? "#f59e0b" : "#ef4444";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030611",
        color: "#f8fafc",
        position: "relative",
        overflowX: "hidden",
        fontFamily: "var(--tl-font)",
      }}
    >
      {/* 3D Interactive WebGL Scene Backdrop */}
      <Executive3DScene opacity={0.8} particleCount={700} showCore={true} />

      {/* Ambient glowing radial lights */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "25%",
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40%",
          right: "5%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Top Executive Navigation Bar */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 48px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(3, 6, 17, 0.6)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #2563eb, #06b6d4)",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              color: "white",
              fontSize: 16,
              boxShadow: "0 0 20px rgba(37, 99, 235, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            TL
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>
              TenderLens{" "}
              <span
                style={{
                  fontSize: 11,
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  padding: "2px 8px",
                  borderRadius: 6,
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  marginLeft: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontFamily: "var(--tl-font-mono)",
                }}
              >
                Executive
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Autonomous Procurement Intelligence &amp; Collusion Defense
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 999,
              fontSize: 11,
              fontFamily: "var(--tl-font-mono)",
              color: "#34d399",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: dotColor,
                display: "inline-block",
                boxShadow: `0 0 8px ${dotColor}`,
              }}
            />
            <span>GATEWAY: {apiStatus.toUpperCase()} ({latency}ms)</span>
          </div>

          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              padding: "9px 20px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13.5,
              textDecoration: "none",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 4px 18px rgba(37, 99, 235, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            <span>Launch Command Portal</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "70px 24px 60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 999,
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.35)",
            color: "#60a5fa",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 28,
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)",
          }}
        >
          <Fingerprint size={15} />
          <span>Executive Clearance Level • Anti-Corruption Oversight</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(34px, 5.5vw, 64px)",
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: "-1.5px",
            margin: "0 auto 24px",
            maxWidth: "980px",
            background: "linear-gradient(180deg, #ffffff 30%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          See Beyond the Tender.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Autonomous Procurement Intelligence.
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 1.8vw, 19px)",
            color: "#94a3b8",
            lineHeight: 1.6,
            maxWidth: "780px",
            margin: "0 auto 40px",
            fontWeight: 400,
          }}
        >
          Engineered for Chief Procurement Officers, High-Level Directors, and Sovereign
          Auditors. Expose bid-rigging rings, front corporations, and systemic collusion
          across multi-billion rupee tenders with neural graph analytics.
        </p>

        {/* Primary CTA Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 60,
          }}
        >
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
              color: "#ffffff",
              padding: "14px 32px",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 10px 30px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <Terminal size={18} />
            <span>Launch Command Center</span>
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/tenders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(15, 23, 42, 0.75)",
              color: "#e2e8f0",
              padding: "14px 28px",
              borderRadius: 14,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            <FileSpreadsheet size={18} />
            <span>Browse Tender Registry</span>
          </Link>
        </div>

        {/* Live Executive KPI Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
            maxWidth: "1060px",
            margin: "0 auto 80px",
          }}
        >
          {[
            { label: "Procurement Monitored", val: "₹48,920 Cr+", sub: "100% Audit Coverage" },
            { label: "Collusion Detection", val: "99.4%", sub: "Neural Accuracy" },
            { label: "Entity Relationships", val: "14,800+", sub: "Cartel Nodes Mapped" },
            { label: "Realtime Telemetry", val: "< 18ms", sub: "Sub-Second Ingestion" },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: "rgba(12, 20, 43, 0.65)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 16,
                padding: "20px 22px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  color: "#94a3b8",
                  fontFamily: "var(--tl-font-mono)",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#ffffff",
                  marginTop: 6,
                  letterSpacing: -0.5,
                }}
              >
                {stat.val}
              </div>
              <div style={{ fontSize: 11.5, color: "#38bdf8", marginTop: 4, fontWeight: 500 }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* 3D Interactive Feature Matrix */}
        <div style={{ textAlign: "left", marginBottom: 30 }}>
          <div
            style={{
              fontSize: 12,
              fontFamily: "var(--tl-font-mono)",
              color: "#38bdf8",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              marginBottom: 6,
            }}
          >
            INTELLIGENCE ARSENAL
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
            Enterprise Capabilities for Higher Officials
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 22,
            textAlign: "left",
            marginBottom: 80,
          }}
        >
          <Tilt3DCard maxTilt={10}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                display: "grid",
                placeItems: "center",
                color: "#60a5fa",
                marginBottom: 16,
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: "#f8fafc" }}>
              Bid-Rigging &amp; Collusion Engine
            </h3>
            <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Autonomous detection of cover bidding, bid rotation, market allocation, and
              abnormal statistical clustering across competing price submittals.
            </p>
          </Tilt3DCard>

          <Tilt3DCard maxTilt={10}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(6, 182, 212, 0.15)",
                border: "1px solid rgba(6, 182, 212, 0.4)",
                display: "grid",
                placeItems: "center",
                color: "#22d3ee",
                marginBottom: 16,
              }}
            >
              <Network size={22} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: "#f8fafc" }}>
              Cartel Relationship Graph
            </h3>
            <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Deep graph algorithms link shared addresses, common directors, phone hashes, and
              joint venture shells to uncover disguised bidding syndicates.
            </p>
          </Tilt3DCard>

          <Tilt3DCard maxTilt={10}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                display: "grid",
                placeItems: "center",
                color: "#a78bfa",
                marginBottom: 16,
              }}
            >
              <BrainCircuit size={22} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: "#f8fafc" }}>
              Forensic Document NLP
            </h3>
            <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Analyzes tender specifications for tailoring indicators, single-vendor bias,
              restrictive eligibility filters, and cross-tender duplicate boilerplate text.
            </p>
          </Tilt3DCard>

          <Tilt3DCard maxTilt={10}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                display: "grid",
                placeItems: "center",
                color: "#34d399",
                marginBottom: 16,
              }}
            >
              <FileCheck2 size={22} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: "#f8fafc" }}>
              Immutable Sovereign Audit
            </h3>
            <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Cryptographically verified audit trails and exportable dossier packets formatted for
              parliamentary committees, C-suites, and legal proceedings.
            </p>
          </Tilt3DCard>
        </div>

        {/* Security & Compliance Badges */}
        <div
          style={{
            padding: "24px 32px",
            borderRadius: 16,
            background: "rgba(12, 20, 43, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Award size={24} color="#38bdf8" />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                Enterprise &amp; Sovereign Security Standards
              </div>
              <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                ISO 27001 Certified Architecture • SOC2 Type II • Multi-Tenant RBAC
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link
              to="/login"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                padding: "8px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign In with MFA →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "28px 48px",
          textAlign: "center",
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} TenderLens Intelligence Systems. Authorized Official Use
          Only.
        </p>
      </footer>
    </div>
  );
}
