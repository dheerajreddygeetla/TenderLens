import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import "../../styles/layout.css";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Auto-close the mobile drawer when route changes
  const handleToggleSidebar = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div
      className={`tl-shell${collapsed ? " tl-collapsed" : ""}${mobileOpen ? " tl-open-mobile" : ""}`}
      data-route={location.pathname}
    >
      {/* Ambient background volumetric lighting */}
      <div
        style={{
          position: "fixed",
          top: "10%",
          left: "20%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "10%",
          right: "15%",
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Sidebar collapsed={collapsed} onToggle={handleToggleSidebar} mobileOpen={mobileOpen} />
      <Navbar onToggleSidebar={handleToggleSidebar} />
      <main className="tl-main" style={{ position: "relative", zIndex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
