import api from "../lib/api.js";

export const reviewApi = {
  list: (params = {}) => api.get("/risks", { params }),
  get: (id) => api.get(`/risks/${id}`),
  summary: () => api.get("/risks/summary"),
  updateStatus: (id, payload) => api.patch(`/risks/${id}/status`, payload),
  addNote: (id, body) => api.post(`/risks/${id}/notes`, { body }),
};
