import api from "../lib/api.js";

export const documentApi = {
  list: (params = {}) => api.get("/documents", { params }),
  get: (id) => api.get(`/documents/${id}`),
  forTender: (tenderId) => api.get(`/tenders/${tenderId}/documents`),
  upload: (file, tenderId) => {
    const fd = new FormData();
    fd.append("file", file);
    if (tenderId) fd.append("tenderId", tenderId);
    return api.post("/documents/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  remove: (id) => api.delete(`/documents/${id}`),
};
