import api from "../lib/api.js";

export const settingsApi = {
  me: () => api.get("/settings/me"),
  updateProfile: (payload) => api.patch("/settings/profile", payload),
  changePassword: (payload) => api.post("/settings/change-password", payload),
  sessions: () => api.get("/settings/sessions"),
  revokeSession: (id) => api.delete(`/settings/sessions/${id}`),
  revokeOtherSessions: () => api.post("/settings/sessions/revoke-others"),
  mfaSetup: () => api.post("/settings/mfa/setup"),
  mfaVerify: (code) => api.post("/settings/mfa/verify", { code }),
  mfaDisable: (password) => api.post("/settings/mfa/disable", { password }),
};
