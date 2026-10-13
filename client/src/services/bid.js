import api from "../lib/api.js";

export const bidApi = {
  list: (params = {}) => api.get("/bids", { params }),
  get: (id) => api.get(`/bids/${id}`),
  forTender: (tenderId) => api.get(`/tenders/${tenderId}/bids`),
  tenderStats: (tenderId) => api.get(`/tenders/${tenderId}/bids/stats`),
};
