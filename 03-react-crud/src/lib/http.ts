import axios from "axios";

const API_URL   = (import.meta.env.VITE_API_URL   ?? "http://localhost:3000/api/v1").replace(/\/+$/, "");
const API_TOKEN =  import.meta.env.VITE_API_TOKEN ?? "1234";

export const http = axios.create({
  baseURL: API_URL,                      // >>> ตัวนี้ต้องลงท้ายด้วย /api/v1
  headers: { Authorization: API_TOKEN }, // ถ้า backend ต้องใช้ header นี้
});
