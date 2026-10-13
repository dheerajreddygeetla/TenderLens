import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../services/auth.js";
import Executive3DScene from "../components/Executive3DScene.jsx";
import { Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import "../styles/auth.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) return setError("Missing or expired reset token in URL");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return setError("Password must contain letters and numbers");
    }
    if (password !== confirm) return setError("Passwords do not match");

    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 1400);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Unable to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tl-auth-shell">
      <Executive3DScene opacity={0.65} particleCount={400} showCore={false} />
      <form className="tl-auth-card" onSubmit={onSubmit} noValidate>
        <div className="tl-brand">
          <div className="tl-brand-mark">TL</div>
          <h1 className="tl-brand-name">TenderLens</h1>
        </div>
        <div className="tl-security-tag">
          <Shield size={12} />
          <span>CRYPTOGRAPHIC CREDENTIAL RE-ISSUE</span>
        </div>

        <p className="tl-sub">Define a new high-entropy security password.</p>

        {error && <div className="tl-error">{error}</div>}
        {done && (
          <div className="tl-success" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} />
            <span>Credentials updated. Initiating secure session…</span>
          </div>
        )}

        {!done && (
          <>
            <label className="tl-label" htmlFor="new">
              New Security Password
            </label>
            <div className="tl-input-wrap">
              <input
                id="new"
                className="tl-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters (letters + numbers)"
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

            <label className="tl-label" htmlFor="confirm">
              Confirm Security Password
            </label>
            <div className="tl-input-wrap">
              <input
                id="confirm"
                className="tl-input"
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter security password"
                disabled={submitting}
              />
            </div>

            <button type="submit" className="tl-btn" disabled={submitting}>
              {submitting ? "Encrypting & Committing…" : "Commit New Password"}
            </button>
          </>
        )}

        <p className="tl-hint">
          <Link to="/login" className="tl-link">
            ← Return to sign-in gateway
          </Link>
        </p>
      </form>
    </div>
  );
}
