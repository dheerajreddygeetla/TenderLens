import api, { getAccessToken } from "../lib/api.js";

const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export const reportsApi = {
  list: (params = {}) => api.get("/reports", { params }),
  get: (id) => api.get(`/reports/${id}`),
  generate: (payload) => api.post("/reports/generate", payload),
  remove: (id) => api.delete(`/reports/${id}`),
  downloadUrl: (id) => {
    const token = getAccessToken();
    return `${baseUrl}/api/reports/${id}/download${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  },
};
