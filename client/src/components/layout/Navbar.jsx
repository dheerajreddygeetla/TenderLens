import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

const titleFromPath = (pathname) => {
  const map = {
    "/dashboard": { title: "Dashboard", crumb: "Overview / Dashboard" },
    "/tenders": { title: "Tenders", crumb: "Procurement / Tenders" },
    "/companies": { title: "Companies", crumb: "AI Intelligence / Companies" },
    "/bids": { title: "Bids & Pricing", crumb: "Procurement / Bids & Pricing" },
    "/contracts": { title: "Contracts", crumb: "Procurement / Contracts" },
    "/documents": { title: "Documents", crumb: "Procurement / Documents" },
    "/analysis": { title: "Tender Analysis", crumb: "AI Intelligence / Tender Analysis" },
    "/risks": { title: "Risk Center", crumb: "AI Intelligence / Risk Center" },
    "/graph": { title: "Relationship Graph", crumb: "AI Intelligence / Relationship Graph" },
    "/map": { title: "Procurement Map", crumb: "Monitoring / Procurement Map" },
    "/reports": { title: "Reports & Audit", crumb: "Monitoring / Reports & Audit" },
    "/notifications": { title: "Notifications", crumb: "System / Notifications" },
    "/settings": { title: "Settings", crumb: "System / Settings" },
  };
  if (map[pathname]) return map[pathname];

  if (pathname.startsWith("/tenders/")) return { title: "Tender Details", crumb: "Procurement / Tenders / Detail" };
  if (pathname.startsWith("/companies/")) return { title: "Company Profile", crumb: "AI Intelligence / Companies / Profile" };
  return { title: "TenderLens", crumb: "" };
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuRef = useRef(null);

  const meta = titleFromPath(location.pathname);

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
        <button className="tl-icon-btn" onClick={onToggleSidebar} title="Toggle sidebar">☰</button>
        <div style={{ minWidth: 0 }}>
          <div className="tl-navbar-title">{meta.title}</div>
          <div className="tl-navbar-breadcrumb">{meta.crumb}</div>
        </div>
      </div>

      <form className="tl-navbar-search" onSubmit={submitSearch}>
        <input
          type="search"
          placeholder="Search tenders, companies, contracts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div className="tl-navbar-right">
        <button className="tl-icon-btn" title="Notifications">
          ◔<span className="tl-dot" />
        </button>
        <button className="tl-icon-btn" title="Help">?</button>

        <div className="tl-user-menu-wrap" ref={menuRef}>
          <button
            className="tl-avatar"
            onClick={() => setMenuOpen((o) => !o)}
            title={user?.fullName}
          >
            {initials(user?.fullName)}
          </button>

          {menuOpen && (
            <div className="tl-user-menu">
              <div className="tl-user-menu-header">
                <div className="tl-user-menu-name">{user?.fullName}</div>
                <div className="tl-user-menu-role">{user?.role}</div>
              </div>
              <Link to="/settings" className="tl-user-menu-item" onClick={() => setMenuOpen(false)}>
                My Profile
              </Link>
              <Link to="/settings" className="tl-user-menu-item" onClick={() => setMenuOpen(false)}>
                Account Settings
              </Link>
              <Link to="/settings" className="tl-user-menu-item" onClick={() => setMenuOpen(false)}>
                Security
              </Link>
              <button className="tl-user-menu-item tl-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
