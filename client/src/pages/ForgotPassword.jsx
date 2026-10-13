import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/auth.js";
import Executive3DScene from "../components/Executive3DScene.jsx";
import { Shield } from "lucide-react";
import "../styles/auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return setError("Enter a valid official email address");
    }

    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setDevToken(res.data?.data?.devResetToken || null);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Failed to process recovery request");
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
          <span>SECURITY CREDENTIAL RECOVERY</span>
        </div>

        <p className="tl-sub">Enter your registered official email to receive a recovery token.</p>

        {error && <div className="tl-error">{error}</div>}

        {done ? (
          <>
            <div className="tl-success">
              If an official account exists for <strong>{email}</strong>, a cryptographically signed
              reset link has been dispatched.
            </div>
            {devToken && (
              <p className="tl-hint" style={{ textAlign: "left", wordBreak: "break-all" }}>
                <strong>Direct Sandbox Token:</strong>{" "}
                <Link to={`/reset-password?token=${devToken}`} className="tl-link">
                  Open Reset Terminal →
                </Link>
              </p>
            )}
          </>
        ) : (
          <>
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
            <button type="submit" className="tl-btn" disabled={submitting}>
              {submitting ? "Dispatching Token…" : "Issue Recovery Token"}
            </button>
          </>
        )}

        <p className="tl-hint">
          <Link to="/login" className="tl-link">
            ← Return to secure gateway
          </Link>
        </p>
      </form>
    </div>
  );
}
