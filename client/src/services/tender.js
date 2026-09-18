import api from "../lib/api.js";

export const tenderApi = {
  list: (params = {}) => api.get("/tenders", { params }),
  get: (id) => api.get(`/tenders/${id}`),
  create: (payload) => api.post("/tenders", payload),
  update: (id, payload) => api.put(`/tenders/${id}`, payload),
  remove: (id) => api.delete(`/tenders/${id}`),
};
