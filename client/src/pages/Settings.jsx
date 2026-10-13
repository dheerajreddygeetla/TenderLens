import { useEffect, useState } from "react";
import { settingsApi } from "../services/settings.js";
import { usersApi } from "../services/users.js";
import { useAuth } from "../hooks/useAuth.js";
import { formatDateTime } from "../utils/format.js";

const TABS = ["Profile", "Security", "Users", "Roles", "System"];

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Profile");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isAdmin = user?.role === "admin";

  const tabs = isAdmin ? TABS : TABS.filter((t) => t !== "Users");

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <h1 className="tl-page-title">Settings</h1>
          <p className="tl-page-sub">Manage your profile, security, users, and system configuration.</p>
        </div>
      </div>

      <div
        style={{
          display: "inline-flex",
          gap: 6,
          marginBottom: 20,
          background: "var(--tl-surface-card)",
          backdropFilter: "var(--tl-glass-blur)",
          padding: 6,
          borderRadius: 14,
          border: "1px solid var(--tl-glass-border)",
        }}
      >
        {tabs.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
                setNotice("");
              }}
              style={{
                border: active ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid transparent",
                background: active
                  ? "linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)"
                  : "transparent",
                color: active ? "#60a5fa" : "var(--tl-text-secondary)",
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: active ? "0 4px 14px rgba(37, 99, 235, 0.2)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {error && <div className="tl-error-bar">{error}</div>}
      {notice && <div className="tl-card" style={{ marginBottom: 12, borderColor: "#86efac", background: "#f0fdf4", color: "#166534", fontSize: 13 }}>{notice}</div>}

      {tab === "Profile" && <ProfileTab onNotice={setNotice} onError={setError} />}
      {tab === "Security" && <SecurityTab onNotice={setNotice} onError={setError} />}
      {tab === "Users" && <UsersTab onNotice={setNotice} onError={setError} />}
      {tab === "Roles" && <RolesTab onError={setError} />}
      {tab === "System" && <SystemTab />}
    </div>
  );
}

// ---------------------------------------------------------------- Profile
function ProfileTab({ onNotice, onError }) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi.me()
      .then((res) => {
        setFullName(res.data.data.fullName || "");
      })
      .catch((err) => onError(err?.response?.data?.error?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [onError]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError(""); onNotice("");
    try {
      await settingsApi.updateProfile({ fullName });
      onNotice("Profile updated.");
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="tl-card"><div className="tl-loading">Loading…</div></div>;

  return (
    <div className="tl-card">
      <h2 className="tl-card-title">Profile</h2>
      <form onSubmit={save}>
        <Row label="Email">
          <input className="tl-input-like" value={user?.email || ""} disabled />
        </Row>
        <Row label="Role">
          <input className="tl-input-like" value={user?.role || ""} disabled />
        </Row>
        <Row label="Full name">
          <input
            className="tl-input-like"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={saving}
          />
        </Row>
        <div style={{ marginTop: 12 }}>
          <button className="tl-btn" style={{ width: "auto" }} disabled={saving}>Save changes</button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- Security
function SecurityTab({ onNotice, onError }) {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [changing, setChanging] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [setup, setSetup] = useState(null); // { qrDataUrl, secret }
  const [code, setCode] = useState("");
  const [disablePass, setDisablePass] = useState("");

  const loadAll = async () => {
    try {
      const [meRes, sessRes] = await Promise.all([settingsApi.me(), settingsApi.sessions()]);
      setMfaEnabled(!!meRes.data.data.mfaEnabled);
      setSessions(sessRes.data.data || []);
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to load security");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    onError(""); onNotice("");
    if (newPass.length < 8 || !/[a-zA-Z]/.test(newPass) || !/\d/.test(newPass)) {
      return onError("Password must be at least 8 characters with letters and numbers");
    }
    if (newPass !== confirm) return onError("Passwords do not match");
    setChanging(true);
    try {
      await settingsApi.changePassword({ currentPassword: current, newPassword: newPass });
      setCurrent(""); setNewPass(""); setConfirm("");
      onNotice("Password updated.");
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to change password");
    } finally {
      setChanging(false);
    }
  };

  const revoke = async (id) => {
    if (!window.confirm("Revoke this session?")) return;
    try {
      await settingsApi.revokeSession(id);
      const res = await settingsApi.sessions();
      setSessions(res.data.data || []);
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to revoke");
    }
  };

  const revokeOthers = async () => {
    if (!window.confirm("Revoke all sessions except this one?")) return;
    try {
      await settingsApi.revokeOtherSessions();
      const res = await settingsApi.sessions();
      setSessions(res.data.data || []);
      onNotice("Other sessions revoked.");
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to revoke");
    }
  };

  const startSetup = async () => {
    onError(""); onNotice("");
    try {
      const res = await settingsApi.mfaSetup();
      setSetup({ qrDataUrl: res.data.data.qrDataUrl, secret: res.data.data.secret });
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to start MFA setup");
    }
  };

  const verifyMfa = async () => {
    onError(""); onNotice("");
    try {
      await settingsApi.mfaVerify(code);
      onNotice("MFA enabled. You will be asked for a code on next login.");
      setSetup(null); setCode("");
      setMfaEnabled(true);
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Invalid code");
    }
  };

  const disableMfa = async () => {
    onError(""); onNotice("");
    try {
      await settingsApi.mfaDisable(disablePass);
      onNotice("MFA disabled.");
      setDisablePass("");
      setMfaEnabled(false);
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to disable MFA");
    }
  };

  return (
    <>
      <div className="tl-card" style={{ marginBottom: 16 }}>
        <h2 className="tl-card-title">Change password</h2>
        <form onSubmit={changePassword}>
          <Row label="Current password">
            <input className="tl-input-like" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Row>
          <Row label="New password">
            <input className="tl-input-like" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          </Row>
          <Row label="Confirm new password">
            <input className="tl-input-like" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Row>
          <div style={{ marginTop: 12 }}>
            <button className="tl-btn" style={{ width: "auto" }} disabled={changing}>Update password</button>
          </div>
        </form>
      </div>

      <div className="tl-card" style={{ marginBottom: 16 }}>
        <h2 className="tl-card-title">Multi-factor authentication</h2>
        {mfaEnabled ? (
          <div>
            <p style={{ fontSize: 13, color: "#065f46", background: "#f0fdf4", padding: 10, borderRadius: 8 }}>
              MFA is <strong>enabled</strong> on your account.
            </p>
            <Row label="Confirm password to disable">
              <input className="tl-input-like" type="password" value={disablePass} onChange={(e) => setDisablePass(e.target.value)} />
            </Row>
            <div style={{ marginTop: 8 }}>
              <button className="tl-btn" style={{ width: "auto", background: "#b91c1c" }} onClick={disableMfa}>Disable MFA</button>
            </div>
          </div>
        ) : setup ? (
          <div>
            <p style={{ fontSize: 13, color: "#334155" }}>
              Scan the QR with your authenticator app, then enter the 6-digit code.
            </p>
            <img src={setup.qrDataUrl} alt="MFA QR" style={{ display: "block", margin: "12px auto", background: "#fff", padding: 8, borderRadius: 8 }} />
            <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginBottom: 12 }}>
              Secret: <code>{setup.secret}</code>
            </div>
            <Row label="Code">
              <input
                className="tl-input-like"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                style={{ maxWidth: 160 }}
              />
            </Row>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button className="tl-btn" style={{ width: "auto" }} onClick={verifyMfa}>Enable MFA</button>
              <button className="tl-btn-ghost" onClick={() => { setSetup(null); setCode(""); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: "#475569" }}>
              MFA is not enabled. Enable it to require a TOTP code at login.
            </p>
            <button className="tl-btn" style={{ width: "auto" }} onClick={startSetup}>Set up MFA</button>
          </div>
        )}
      </div>

      <div className="tl-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 className="tl-card-title" style={{ margin: 0 }}>Active sessions</h2>
          <button className="tl-btn-ghost" onClick={revokeOthers}>Revoke all others</button>
        </div>

        {loadingSessions ? (
          <div className="tl-loading">Loading sessions…</div>
        ) : (
          <div className="tl-table-wrap">
            <table className="tl-table">
              <thead>
                <tr><th>Created</th><th>Expires</th><th>IP</th><th>User agent</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{formatDateTime(s.createdAt)}</td>
                    <td>{formatDateTime(s.expiresAt)}</td>
                    <td>{s.ip || "—"}</td>
                    <td style={{ maxWidth: 320, whiteSpace: "normal", fontSize: 12 }}>{s.userAgent || "—"}</td>
                    <td>{s.active ? <span className="tl-badge tl-badge-awarded">active</span> : "revoked"}</td>
                    <td>
                      {s.active && (
                        <button
                          onClick={() => revoke(s.id)}
                          style={{ background: "transparent", border: 0, color: "#b91c1c", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={6}><div className="tl-empty">No sessions.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Users
function UsersTab({ onNotice, onError }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", fullName: "", password: "", roleName: "viewer" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    usersApi.list()
      .then((res) => setUsers(res.data.data || []))
      .catch((err) => onError(err?.response?.data?.error?.message || "Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true); onError(""); onNotice("");
    try {
      await usersApi.create(form);
      onNotice("User created.");
      setShowCreate(false);
      setForm({ email: "", fullName: "", password: "", roleName: "viewer" });
      load();
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (u) => {
    try {
      await usersApi.update(u.id, { isActive: !u.isActive });
      load();
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to update");
    }
  };

  const changeRole = async (u, roleName) => {
    try {
      await usersApi.update(u.id, { roleName });
      load();
    } catch (err) {
      onError(err?.response?.data?.error?.message || "Failed to update role");
    }
  };

  return (
    <div className="tl-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 className="tl-card-title" style={{ margin: 0 }}>Users</h2>
        <button className="tl-btn" style={{ width: "auto" }} onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? "Close" : "+ New user"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={create} style={{ marginBottom: 16, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <Row label="Email">
            <input className="tl-input-like" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Row>
          <Row label="Full name">
            <input className="tl-input-like" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </Row>
          <Row label="Password">
            <input className="tl-input-like" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </Row>
          <Row label="Role">
            <select
              className="tl-input-like"
              value={form.roleName}
              onChange={(e) => setForm({ ...form, roleName: e.target.value })}
            >
              <option value="admin">admin</option>
              <option value="officer">officer</option>
              <option value="auditor">auditor</option>
              <option value="viewer">viewer</option>
            </select>
          </Row>
          <div style={{ marginTop: 8 }}>
            <button className="tl-btn" style={{ width: "auto" }} disabled={saving}>{saving ? "Saving…" : "Create user"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="tl-loading">Loading users…</div>
      ) : (
        <div className="tl-table-wrap">
          <table className="tl-table">
            <thead>
              <tr><th>Email</th><th>Name</th><th>Role</th><th>MFA</th><th>Last login</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.fullName}</td>
                  <td>
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="tl-input-like" style={{ minWidth: 100 }}>
                      <option value="admin">admin</option>
                      <option value="officer">officer</option>
                      <option value="auditor">auditor</option>
                      <option value="viewer">viewer</option>
                    </select>
                  </td>
                  <td>{u.mfaEnabled ? "On" : "Off"}</td>
                  <td>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</td>
                  <td>
                    <span className={`tl-badge ${u.isActive ? "tl-badge-awarded" : "tl-badge-cancelled"}`}>
                      {u.isActive ? "active" : "disabled"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggle(u)}
                      style={{
                        background: "transparent", border: 0,
                        color: u.isActive ? "#b91c1c" : "#065f46",
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {u.isActive ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Roles
function RolesTab({ onError }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.roles()
      .then((res) => setRoles(res.data.data || []))
      .catch((err) => onError(err?.response?.data?.error?.message || "Failed to load roles"))
      .finally(() => setLoading(false));
  }, [onError]);

  return (
    <div className="tl-card">
      <h2 className="tl-card-title">Roles &amp; permissions</h2>
      {loading ? (
        <div className="tl-loading">Loading roles…</div>
      ) : (
        roles.map((r) => (
          <div key={r.name} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 6 }}>{r.description}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {r.permissions.map((p) => (
                <span key={p} className="tl-badge tl-badge-open" style={{ textTransform: "none" }}>{p}</span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------- System
function SystemTab() {
  return (
    <div className="tl-card">
      <h2 className="tl-card-title">System</h2>
      <p style={{ fontSize: 13, color: "#475569" }}>
        Notification preferences, retention policies, and AI configuration will be exposed here in a future release.
      </p>
      <ul style={{ fontSize: 13, color: "#64748b" }}>
        <li>Realtime notifications: enabled (WebSocket)</li>
        <li>Document processing: BullMQ worker, concurrency 3</li>
        <li>Graph: Neo4j with APOC procedures</li>
        <li>Storage: local file system under <code>server/uploads/</code></li>
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- helpers
function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
      <label style={{ minWidth: 180, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</label>
      <div style={{ flex: 1, minWidth: 220 }}>{children}</div>
    </div>
  );
}
