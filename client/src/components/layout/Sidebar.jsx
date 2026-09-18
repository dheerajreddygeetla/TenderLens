import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

const SECTIONS = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", icon: "◧", label: "Dashboard" }],
  },
  {
    label: "Procurement",
    items: [
      { to: "/tenders", icon: "▤", label: "Tenders" },
      { to: "/bids", icon: "₹", label: "Bids & Pricing" },
      { to: "/contracts", icon: "❖", label: "Contracts" },
      { to: "/documents", icon: "▦", label: "Documents" },
    ],
  },
  {
    label: "AI Intelligence",
    items: [
      { to: "/analysis", icon: "✦", label: "Tender Analysis" },
      { to: "/risks", icon: "⚠", label: "Risk Center" },
      { to: "/companies", icon: "⌂", label: "Companies" },
      { to: "/graph", icon: "◯", label: "Relationship Graph" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { to: "/map", icon: "◉", label: "Procurement Map" },
      { to: "/reports", icon: "⎙", label: "Reports & Audit" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/notifications", icon: "◔", label: "Notifications", badge: 3 },
      { to: "/settings", icon: "⚙", label: "Settings" },
    ],
  },
];

const initials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export default function Sidebar({ collapsed, onToggle, mobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="tl-sidebar">
      <div className="tl-sidebar-header">
        <div className="tl-sidebar-brand">
          <div className="tl-sidebar-brand-mark">TL</div>
          {!collapsed && <span>TenderLens</span>}
        </div>
        {!mobileOpen && (
          <button
            className="tl-sidebar-toggle"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
        )}
      </div>

      <nav className="tl-nav">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && <div className="tl-nav-section-label">{section.label}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `tl-nav-link${isActive ? " tl-active" : ""}`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="tl-nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge ? (
                  <span className="tl-nav-badge">{item.badge}</span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="tl-sidebar-footer">
        <div className="tl-user-chip" title={user?.email}>
          <div className="tl-user-chip-avatar">{initials(user?.fullName)}</div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div className="tl-user-chip-name">{user?.fullName}</div>
              <div className="tl-user-chip-role">{user?.role}</div>
            </div>
          )}
        </div>
        <button className="tl-logout-btn" onClick={handleLogout}>
          {collapsed ? "⏻" : "Log out"}
        </button>
      </div>
    </aside>
  );
}
