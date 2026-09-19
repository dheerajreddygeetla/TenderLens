import api from "../lib/api.js";

export const analysisApi = {
  get: (tenderId) => api.get(`/analysis/${tenderId}`),
  run: (tenderId) => api.post(`/analysis/${tenderId}/run`),
};
