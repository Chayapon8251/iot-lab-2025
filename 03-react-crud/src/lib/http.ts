import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// ใส่ Authorization header ทุกครั้ง
http.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_AUTH_TOKEN ?? "1234";
  config.headers = config.headers ?? {};
  (config.headers as any).Authorization = token;
  return config;
});
