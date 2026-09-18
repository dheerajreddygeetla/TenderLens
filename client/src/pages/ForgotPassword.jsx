import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/auth.js";
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
      return setError("Enter a valid email address");
    }

    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setDevToken(res.data?.data?.devResetToken || null);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tl-auth-shell">
      <form className="tl-auth-card" onSubmit={onSubmit} noValidate>
        <div className="tl-brand">
          <div className="tl-brand-mark">TL</div>
          <h1 className="tl-brand-name">TenderLens</h1>
        </div>
        <p className="tl-sub">Forgot password</p>

        {error && <div className="tl-error">{error}</div>}

        {done ? (
          <>
            <div className="tl-success">
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
            </div>
            {devToken && (
              <p className="tl-hint">
                <strong>Dev mode:</strong> open{" "}
                <Link to={`/reset-password?token=${devToken}`}>/reset-password?token={devToken.slice(0, 12)}…</Link>
              </p>
            )}
          </>
        ) : (
          <>
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
            <button type="submit" className="tl-btn" disabled={submitting}>
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}

        <p className="tl-hint">
          <Link to="/login" className="tl-link">← Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}
