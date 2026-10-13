import api from "../lib/api.js";

export const companyApi = {
  list: (params = {}) => api.get("/companies", { params }),
  get: (id) => api.get(`/companies/${id}`),
  profile: (id) => api.get(`/companies/${id}/profile`),
  tenders: (id) => api.get(`/companies/${id}/tenders`),
  contracts: (id) => api.get(`/companies/${id}/contracts`),
  departments: (id) => api.get(`/companies/${id}/departments`),
  timeline: (id) => api.get(`/companies/${id}/timeline`),
  create: (payload) => api.post("/companies", payload),
  update: (id, payload) => api.put(`/companies/${id}`, payload),
};
