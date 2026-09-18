import api from "../lib/api.js";

export const companyApi = {
  list: (params = {}) => api.get("/companies", { params }),
  get: (id) => api.get(`/companies/${id}`),
  create: (payload) => api.post("/companies", payload),
  update: (id, payload) => api.put(`/companies/${id}`, payload),
};
