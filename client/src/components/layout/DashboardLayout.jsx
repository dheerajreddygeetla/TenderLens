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
      <Sidebar collapsed={collapsed} onToggle={handleToggleSidebar} mobileOpen={mobileOpen} />
      <Navbar onToggleSidebar={handleToggleSidebar} />
      <main className="tl-main">
        <Outlet />
      </main>
    </div>
  );
}
