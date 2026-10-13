import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Executive3DScene from "../components/Executive3DScene.jsx";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Shield,
} from "lucide-react";
import "../styles/auth.css";

export default function Login() {
  const { login, completeMfa, cancelMfa, mfa } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  const validate = () => {
    if (!email.trim()) return "Official email is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid official email address";
    if (!password) return "Security password is required";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (result.mfaRequired) return; // AuthContext switched to MFA step
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          "Unable to sign in. Please verify your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onMfaSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{4,8}$/.test(mfaCode.replace(/\s+/g, ""))) {
      return setError("Enter the 6-digit authentication token");
    }
    setSubmitting(true);
    try {
      await completeMfa(mfaCode);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Invalid authentication token");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: "admin@tenderlens.local", password: "Admin@12345" },
      officer: { email: "officer@tenderlens.local", password: "Officer@12345" },
      auditor: { email: "auditor@tenderlens.local", password: "Auditor@12345" },
      viewer: { email: "viewer@tenderlens.local", password: "Viewer@12345" },
    }[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
      setError("");
    }
  };

  if (mfa) {
    return (
      <div className="tl-auth-shell">
        <Executive3DScene opacity={0.65} particleCount={400} showCore={false} />
        <form className="tl-auth-card" onSubmit={onMfaSubmit} noValidate>
          <div className="tl-brand">
            <div className="tl-brand-mark">TL</div>
            <h1 className="tl-brand-name">TenderLens</h1>
          </div>
          <div className="tl-security-tag">
            <Shield size={12} />
            <span>MFA ENFORCED • LEVEL 5 VERIFICATION</span>
          </div>

          <p className="tl-sub">Enter the hardware or authenticator app token.</p>

          {error && <div className="tl-error">{error}</div>}

          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
            Verifying identity for{" "}
            <strong style={{ color: "#ffffff" }}>{mfa.hintUser?.email}</strong>.
          </p>

          <label className="tl-label" htmlFor="code">
            Authentication Token
          </label>
          <div className="tl-input-wrap">
            <input
              id="code"
              className="tl-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="000 000"
              disabled={submitting}
              autoFocus
              style={{
                fontFamily: "var(--tl-font-mono)",
                letterSpacing: "4px",
                fontSize: "18px",
                textAlign: "center",
              }}
            />
          </div>

          <button type="submit" className="tl-btn" disabled={submitting}>
            {submitting ? "Authenticating Clearance…" : "Authorize Session"}
          </button>

          <p className="tl-hint">
            <button
              type="button"
              onClick={cancelMfa}
              className="tl-link"
              style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}
            >
              ← Return to credential sign-in
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="tl-auth-shell">
      <Executive3DScene opacity={0.65} particleCount={500} showCore={false} />
      <form className="tl-auth-card" onSubmit={onSubmit} noValidate>
        <div className="tl-brand">
          <div className="tl-brand-mark">TL</div>
          <div>
            <h1 className="tl-brand-name">TenderLens</h1>
          </div>
        </div>

        <div className="tl-security-tag">
          <ShieldCheck size={12} />
          <span>OFFICIAL ACCESS PORTAL • SECURE GATEWAY</span>
        </div>

        <p className="tl-sub">Autonomous Procurement &amp; Anti-Collusion Intelligence</p>

        {error && <div className="tl-error">{error}</div>}

        <label className="tl-label" htmlFor="email">
          Official Email
        </label>
        <div className="tl-input-wrap">
          <input
            id="email"
            className="tl-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="official@agency.gov"
            disabled={submitting}
          />
        </div>

        <label className="tl-label" htmlFor="password">
          Security Password
        </label>
        <div className="tl-input-wrap">
          <input
            id="password"
            className="tl-input"
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            disabled={submitting}
          />
          <button
            type="button"
            className="tl-toggle-pass"
            onClick={() => setShowPass((s) => !s)}
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <div className="tl-row">
          <label className="tl-checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Remember session</span>
          </label>
          <Link to="/forgot-password" className="tl-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="tl-btn" disabled={submitting}>
          {submitting ? (
            <span>Authorizing…</span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Authenticate Session</span>
              <ArrowRight size={16} />
            </span>
          )}
        </button>

        <div className="tl-demo">
          <div style={{ marginBottom: 10, fontWeight: 600, color: "#94a3b8" }}>
            Direct Demo Clearance Profiles:
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="tl-demo-role-btn"
              onClick={() => fillDemo("admin")}
              title="CPO / System Administrator"
            >
              Director (Admin)
            </button>
            <button
              type="button"
              className="tl-demo-role-btn"
              onClick={() => fillDemo("officer")}
              title="Procurement Officer"
            >
              Officer
            </button>
            <button
              type="button"
              className="tl-demo-role-btn"
              onClick={() => fillDemo("auditor")}
              title="Anti-Corruption Auditor"
            >
              Auditor
            </button>
            <button
              type="button"
              className="tl-demo-role-btn"
              onClick={() => fillDemo("viewer")}
              title="Observer / Parliamentary"
            >
              Viewer
            </button>
          </div>
        </div>

        <p className="tl-hint">
          Protected by Sovereign 256-bit encryption. All access attempts are recorded in the
          immutable audit registry.
        </p>
      </form>
    </div>
  );
}
