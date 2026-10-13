import api from "../lib/api.js";

export const entityMatchApi = {
  list: (params = {}) => api.get("/entity-matches", { params }),
  stats: () => api.get("/entity-matches/stats"),
  generate: (params = {}) => api.post("/entity-matches/generate", null, { params }),
  decide: (id, decision) => api.patch(`/entity-matches/${id}`, { decision }),
};
