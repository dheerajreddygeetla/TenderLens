import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import api, { setAccessToken, setUnauthorizedHandler } from "../lib/api.js";
import { authApi } from "../services/auth.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | guest

  const applySession = useCallback((sessionUser, token) => {
    setAccessToken(token);
    setUser(sessionUser);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("guest");
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login(email, password);
      const { user: u, accessToken } = res.data.data;
      applySession(u, accessToken);
      return u;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* best effort */
    }
    clearSession();
  }, [clearSession]);

  // Silent refresh on mount + register global unauthorized handler
  useEffect(() => {
    let cancelled = false;

    setUnauthorizedHandler(() => {
      if (!cancelled) clearSession();
    });

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
    () => ({ user, status, login, logout }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
