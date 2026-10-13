import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useNotifications } from "../../hooks/useNotifications.js";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Coins,
  FileCheck,
  FolderArchive,
  BrainCircuit,
  ShieldAlert,
  Building2,
  Network,
  Compass,
  FileBarChart2,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const initials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export default function Sidebar({ collapsed, onToggle, mobileOpen }) {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const navigate = useNavigate();

  const SECTIONS = [
    {
      label: "Overview",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Command Center" },
      ],
    },
    {
      label: "Procurement Ops",
      items: [
        { to: "/tenders", icon: FileSpreadsheet, label: "Tender Registry" },
        { to: "/bids", icon: Coins, label: "Bids & Pricing" },
        { to: "/contracts", icon: FileCheck, label: "Contract Awards" },
        { to: "/documents", icon: FolderArchive, label: "Document Vault" },
      ],
    },
    {
      label: "AI Threat & Graph",
      items: [
        { to: "/analysis", icon: BrainCircuit, label: "Neural Analysis" },
        { to: "/risks", icon: ShieldAlert, label: "Risk Matrix" },
        { to: "/companies", icon: Building2, label: "Corporate Dossiers" },
        { to: "/graph", icon: Network, label: "Collusion Graph" },
      ],
    },
    {
      label: "Surveillance",
      items: [
        { to: "/map", icon: Compass, label: "Tactical Map" },
        { to: "/reports", icon: FileBarChart2, label: "Audit Reports" },
      ],
    },
    {
      label: "System",
      items: [
        {
          to: "/notifications",
          icon: Bell,
          label: "Alert Telemetry",
          badge: unread || undefined,
        },
        { to: "/settings", icon: Settings, label: "System Config" },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="tl-sidebar">
      <div className="tl-sidebar-header">
        <div className="tl-sidebar-brand">
          <div className="tl-sidebar-brand-mark">TL</div>
          {!collapsed && (
            <div className="tl-sidebar-brand-title">
              <span>TenderLens</span>
              <span className="tl-sidebar-brand-sub">Executive Suite</span>
            </div>
          )}
        </div>
        {!mobileOpen && (
          <button
            className="tl-sidebar-toggle"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {!collapsed && (
        <div
          style={{
            padding: "10px 14px 4px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            fontFamily: "var(--tl-font-mono)",
            color: "#34d399",
            background: "rgba(16, 185, 129, 0.06)",
            borderBottom: "1px solid rgba(16, 185, 129, 0.15)",
          }}
        >
          <ShieldCheck size={13} />
          <span>SECURITY CLEARANCE: L5</span>
        </div>
      )}

      <nav className="tl-nav">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="tl-nav-section-label">{section.label}</div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `tl-nav-link${isActive ? " tl-active" : ""}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="tl-nav-icon">
                    <Icon size={18} />
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge ? (
                    <span className="tl-nav-badge">{item.badge}</span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="tl-sidebar-footer">
        <div className="tl-user-chip" title={user?.email}>
          <div className="tl-user-chip-avatar">{initials(user?.fullName)}</div>
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="tl-user-chip-name">{user?.fullName || "Official"}</div>
              <div className="tl-user-chip-role">{user?.role || "Director"}</div>
            </div>
          )}
        </div>
        <button className="tl-logout-btn" onClick={handleLogout} title="Log Out">
          <LogOut size={15} />
          {!collapsed && <span>Exit Portal</span>}
        </button>
      </div>
    </aside>
  );
}
