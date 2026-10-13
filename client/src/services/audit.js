import api from "../lib/api.js";

export const auditApi = {
  list: (params = {}) => api.get("/audit", { params }),
};
