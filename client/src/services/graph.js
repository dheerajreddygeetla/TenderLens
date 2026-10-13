import api from "../lib/api.js";

export const graphApi = {
  sync: () => api.post("/graph/sync"),
  syncStatus: () => api.get("/graph/sync/status"),
  search: (q, limit = 10) => api.get("/graph/search", { params: { q, limit } }),
  neighborhood: (kind, id, { depth = 1, types = [] } = {}) =>
    api.get(`/graph/entity/${kind}/${id}`, {
      params: { depth, types: types.join(",") },
    }),
  preset: (name, payload) => api.post(`/graph/preset/${name}`, payload),
};
