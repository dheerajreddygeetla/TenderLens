import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useNotifications } from "../../hooks/useNotifications.js";
import { useSocket } from "../../hooks/useSocket.js";
import { useTheme } from "../../hooks/useTheme.js";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Shield,
  KeyRound,
  LogOut,
} from "lucide-react";

const titleFromPath = (pathname) => {
  const map = {
    "/dashboard": { title: "Executive Command Center", crumb: "Executive / Command Center" },
    "/tenders": { title: "Tender Registry", crumb: "Procurement / Tenders" },
    "/companies": { title: "Corporate Dossiers", crumb: "AI Intelligence / Companies" },
    "/bids": { title: "Bids & Pricing Matrix", crumb: "Procurement / Bids & Pricing" },
    "/contracts": { title: "Contract Awards", crumb: "Procurement / Contracts" },
    "/documents": { title: "Document Vault", crumb: "Procurement / Documents" },
    "/analysis": { title: "Neural Tender Analysis", crumb: "AI Intelligence / Analysis" },
    "/risks": { title: "Risk Center & Threat Matrix", crumb: "AI Intelligence / Risk Center" },
    "/graph": { title: "Collusion & Relationship Graph", crumb: "AI Intelligence / Cartel Graph" },
    "/map": { title: "Tactical Procurement Map", crumb: "Surveillance / Tactical Map" },
    "/reports": { title: "Executive Audit & Reports", crumb: "Surveillance / Reports" },
    "/notifications": { title: "Realtime Telemetry & Alerts", crumb: "System / Notifications" },
    "/settings": { title: "System Preferences", crumb: "System / Settings" },
  };
  if (map[pathname]) return map[pathname];
  if (pathname.startsWith("/tenders/"))
    return { title: "Tender Dossier", crumb: "Procurement / Tenders / Dossier" };
  if (pathname.startsWith("/companies/"))
    return { title: "Company Profile", crumb: "AI Intelligence / Companies / Profile" };
  if (pathname.startsWith("/analysis/"))
    return { title: "Deep Neural Analysis", crumb: "AI Intelligence / Analysis" };
  if (pathname.startsWith("/risks/"))
    return { title: "Indicator Investigation", crumb: "AI Intelligence / Risk Center / Detail" };
  return { title: "TenderLens Executive", crumb: "" };
};

const initials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unread } = useNotifications();
  const { connected } = useSocket();
  const { theme, toggle } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const meta = titleFromPath(location.pathname);

  // Global Ctrl+K / Cmd+K search focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/tenders?search=${encodeURIComponent(q)}`);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="tl-navbar">
      <div className="tl-navbar-left">
        <button className="tl-icon-btn" onClick={onToggleSidebar} title="Toggle Sidebar">
          <Menu size={18} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div className="tl-navbar-title">{meta.title}</div>
          <div className="tl-navbar-breadcrumb">{meta.crumb}</div>
        </div>
      </div>

      <form className="tl-navbar-search" onSubmit={submitSearch}>
        <span className="tl-navbar-search-icon">
          <Search size={16} />
        </span>
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search tenders, contractors, bids, indicators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="tl-navbar-shortcut">⌘K</span>
      </form>

      <div className="tl-navbar-right">
        {/* Realtime Live Telemetry Pill */}
        <div
          className="tl-system-status"
          title={connected ? "Realtime Socket: Active (Zero latency)" : "Realtime Socket: Disconnected"}
        >
          <span className={`tl-system-dot ${connected ? "" : "tl-offline"}`} />
          <span>{connected ? "LIVE • 18ms" : "OFFLINE"}</span>
        </div>

        {/* Notifications */}
        <Link
          to="/notifications"
          className="tl-icon-btn"
          title="Telemetry Alerts"
          style={{ textDecoration: "none" }}
        >
          <Bell size={18} />
          {unread > 0 && <span className="tl-dot" />}
        </Link>

        {/* Theme Switcher */}
        <button
          className="tl-icon-btn"
          onClick={toggle}
          title={theme === "dark" ? "Switch to Alabaster Frost (Light)" : "Switch to Obsidian (Dark)"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Profile Menu */}
        <div className="tl-user-menu-wrap" ref={menuRef}>
          <button
            className="tl-avatar"
            onClick={() => setMenuOpen((o) => !o)}
            title={user?.fullName || "Executive Profile"}
          >
            {initials(user?.fullName)}
          </button>

          {menuOpen && (
            <div className="tl-user-menu">
              <div className="tl-user-menu-header">
                <div className="tl-user-menu-name">{user?.fullName || "Director"}</div>
                <div className="tl-user-menu-role">Role: {user?.role || "High Official"}</div>
                <div style={{ fontSize: 11, color: "var(--tl-text-dim)", marginTop: 4, fontFamily: "var(--tl-font-mono)" }}>
                  {user?.email}
                </div>
              </div>
              <Link to="/settings" className="tl-user-menu-item" onClick={() => setMenuOpen(false)}>
                <User size={15} />
                <span>Executive Dossier</span>
              </Link>
              <Link to="/settings" className="tl-user-menu-item" onClick={() => setMenuOpen(false)}>
                <Shield size={15} />
                <span>Security Clearance</span>
              </Link>
              <Link to="/settings" className="tl-user-menu-item" onClick={() => setMenuOpen(false)}>
                <KeyRound size={15} />
                <span>API Keys &amp; Webhooks</span>
              </Link>
              <button className="tl-user-menu-item tl-danger" onClick={handleLogout}>
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
