import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { setAccessToken, setUnauthorizedHandler } from "../lib/api.js";
import { authApi } from "../services/auth.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | guest | mfa
  const [mfa, setMfa] = useState(null); // { mfaToken, hintUser }

  const applySession = useCallback((sessionUser, token) => {
    setAccessToken(token);
    setUser(sessionUser);
    setStatus("authenticated");
    setMfa(null);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("guest");
    setMfa(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const data = res.data.data;
    if (data.mfaRequired) {
      setMfa({ mfaToken: data.mfaToken, hintUser: data.user });
      setStatus("mfa");
      return { mfaRequired: true };
    }
    applySession(data.user, data.accessToken);
    return { mfaRequired: false, user: data.user };
  }, [applySession]);

  const completeMfa = useCallback(async (code) => {
    if (!mfa?.mfaToken) throw new Error("No MFA challenge in progress");
    const res = await authApi.mfaChallenge(mfa.mfaToken, code);
    const { user: u, accessToken } = res.data.data;
    applySession(u, accessToken);
    return u;
  }, [mfa, applySession]);

  const cancelMfa = useCallback(() => {
    setMfa(null);
    setStatus("guest");
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    setUnauthorizedHandler(() => { if (!cancelled) clearSession(); });

    (async () => {
      try {
        const res = await authApi.refresh();
        if (cancelled) return;
        const { user: u, accessToken } = res.data.data;
        applySession(u, accessToken);
      } catch {
        if (cancelled) return;
        clearSession();
      }
    })();

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [applySession, clearSession]);

  const value = useMemo(
    () => ({ user, status, login, logout, completeMfa, cancelMfa, mfa }),
    [user, status, login, logout, completeMfa, cancelMfa, mfa]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
