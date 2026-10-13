import api from "../lib/api.js";

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  mfaChallenge: (mfaToken, code) => api.post("/auth/mfa/challenge", { mfaToken, code }),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) => api.post("/auth/reset-password", { token, newPassword }),
};
