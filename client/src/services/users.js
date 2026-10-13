import api from "../lib/api.js";

export const usersApi = {
  list: () => api.get("/users"),
  roles: () => api.get("/users/roles/all"),
  create: (payload) => api.post("/users", payload),
  update: (id, payload) => api.patch(`/users/${id}`, payload),
};
