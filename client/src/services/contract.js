import api from "../lib/api.js";

export const contractApi = {
  list: (params = {}) => api.get("/contracts", { params }),
  get: (id) => api.get(`/contracts/${id}`),
  forTender: (tenderId) => api.get(`/tenders/${tenderId}/contracts`),
  addAmendment: (id, payload) => api.post(`/contracts/${id}/amendments`, payload),
};
