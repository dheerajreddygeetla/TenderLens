import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address";
    if (!password) return "Password is required";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        "Unable to sign in. Please check your credentials.";
      setError(msg);
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

  return (
    <div className="tl-auth-shell">
      <form className="tl-auth-card" onSubmit={onSubmit} noValidate>
        <div className="tl-brand">
          <div className="tl-brand-mark">TL</div>
          <h1 className="tl-brand-name">TenderLens</h1>
        </div>
        <p className="tl-sub">AI-Powered Procurement Intelligence</p>

        {error && <div className="tl-error">{error}</div>}

        <label className="tl-label" htmlFor="email">Email</label>
        <div className="tl-input-wrap">
          <input
            id="email"
            className="tl-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@agency.gov"
            disabled={submitting}
          />
        </div>

        <label className="tl-label" htmlFor="password">Password</label>
        <div className="tl-input-wrap">
          <input
            id="password"
            className="tl-input"
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={submitting}
          />
          <button
            type="button"
            className="tl-toggle-pass"
            onClick={() => setShowPass((s) => !s)}
            tabIndex={-1}
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>

        <div className="tl-row">
          <label className="tl-checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="tl-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="tl-btn" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="tl-demo">
          <div style={{ marginBottom: 8 }}>Demo logins (development only):</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="tl-btn tl-btn-secondary" style={{ width: "auto", padding: "6px 10px" }} onClick={() => fillDemo("admin")}>admin</button>
            <button type="button" className="tl-btn tl-btn-secondary" style={{ width: "auto", padding: "6px 10px" }} onClick={() => fillDemo("officer")}>officer</button>
            <button type="button" className="tl-btn tl-btn-secondary" style={{ width: "auto", padding: "6px 10px" }} onClick={() => fillDemo("auditor")}>auditor</button>
            <button type="button" className="tl-btn tl-btn-secondary" style={{ width: "auto", padding: "6px 10px" }} onClick={() => fillDemo("viewer")}>viewer</button>
          </div>
        </div>

        <p className="tl-hint">
          Authorized use only. All activity is logged for audit purposes.
        </p>
      </form>
    </div>
  );
}
