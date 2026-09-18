import { useAuth } from "../hooks/useAuth.js";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const card = {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 20,
    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--tl-bg)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: "linear-gradient(135deg,#2563eb,#60a5fa)",
                color: "white", display: "grid", placeItems: "center", fontWeight: 700,
              }}
            >
              TL
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>TenderLens</div>
              <div style={{ fontSize: 12, color: "var(--tl-text-600)" }}>Dashboard (Day 2 placeholder)</div>
            </div>
          </div>
          <button className="tl-btn tl-btn-secondary" style={{ width: "auto" }} onClick={logout}>
            Log out
          </button>
        </header>

        <section style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Welcome, {user?.fullName || "user"} 👋</h2>
          <p style={{ color: "var(--tl-text-600)", marginTop: 6 }}>
            You are signed in as <strong>{user?.role}</strong>.
          </p>
        </section>

        <section style={{ ...card }}>
          <h3 style={{ marginTop: 0 }}>Session</h3>
          <pre
            style={{
              background: "#0b1220", color: "#e2e8f0", padding: 16,
              borderRadius: 8, fontSize: 12, overflowX: "auto",
            }}
          >
{JSON.stringify(
  {
    id: user?.id,
    email: user?.email,
    fullName: user?.fullName,
    role: user?.role,
    permissions: user?.permissions,
  },
  null,
  2
)}
          </pre>
        </section>
      </div>
    </div>
  );
}
