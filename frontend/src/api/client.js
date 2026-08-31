import axios from "axios";

const API_BASE = "http://localhost:8000";

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("crimenet_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("crimenet_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const login = (username, password) =>
  client.post("/api/auth/login", { username, password }).then((r) => r.data);

export const getCases = () => client.get("/api/cases").then((r) => r.data);
export const createCase = (payload) => client.post("/api/cases", payload).then((r) => r.data);
export const getCase = (id) => client.get(`/api/cases/${id}`).then((r) => r.data);
export const getCaseReports = (id) => client.get(`/api/cases/${id}/reports`).then((r) => r.data);
export const uploadReport = (caseId, file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return client
    .post(`/api/cases/${caseId}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (evt) => onProgress(Math.round((evt.loaded / evt.total) * 100))
        : undefined,
    })
    .then((r) => r.data);
};

export const getEntities = (params) => client.get("/api/entities", { params: params || {} }).then((r) => r.data);
export const getEntityDetail = (id) => client.get(`/api/entities/${id}`).then((r) => r.data);

export const searchAll = (q) => client.get("/api/search", { params: { q } }).then((r) => r.data);

export const getGraph = (params) => client.get("/api/graph", { params }).then((r) => r.data);

export const getInsights = (params) => client.get("/api/insights", { params: params || {} }).then((r) => r.data);
export const toggleInsightReviewed = (id) => client.patch(`/api/insights/${id}/review`).then((r) => r.data);

export const getDashboardStats = () => client.get("/api/dashboard/stats").then((r) => r.data);

export default client;
