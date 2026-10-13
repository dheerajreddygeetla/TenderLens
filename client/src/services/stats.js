import api from "../lib/api.js";

export const statsApi = {
  summary: () => api.get("/stats/summary"),
  tendersOverTime: () => api.get("/stats/tenders-over-time"),
  valueByDepartment: () => api.get("/stats/value-by-department"),
  mapData: () => api.get("/stats/map"),
};
