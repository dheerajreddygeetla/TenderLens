import axios from "axios";

const rawUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();
const BASE_URL = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl.replace(/\/+$/, "")}/api`;

/** Access token lives in memory only — never localStorage. */
let accessToken = null;
let onUnauthorized = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = typeof fn === "function" ? fn : null;
};

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Single-flight refresh
let refreshPromise = null;
const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => res.data?.data?.accessToken || null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = original.url || "";

    const isAuthEndpoint = url.startsWith("/auth/");

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          setAccessToken(token);
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
          return api(original);
        }
      } catch {
        if (onUnauthorized) onUnauthorized();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
