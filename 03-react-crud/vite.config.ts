// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,                               // ให้ bind 0.0.0.0
    port: 5173,   // ใช้พอร์ตของ Render
    allowedHosts: ["iot-lab-2025-1.onrender.com"],
  },
  // เผื่อ dev ในเครื่อง
  server: { host: true, port: 5173 },
});
