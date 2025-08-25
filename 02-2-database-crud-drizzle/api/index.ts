import 'dotenv/config'

import { Hono } from "hono";
import { cors } from "hono/cors";
import apiRouter from "./routes/api.js";
import { serve } from "@hono/node-server";
import categoriesRouter from "./routes/categories.js";

const app = new Hono().basePath("/api");
export default app; 
// CORS
app.use(
  "*",
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://iot-lab-2025-3.onrender.com'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86400,
  })
);

// Middleware ตรวจ Authorization (ถ้าต้องการ)
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next();
  // ตรวจ token ที่นี่ถ้าต้องการ
  return next();
});

app.route("/v1", apiRouter);

app.route("/v1/categories", categoriesRouter);
// app.route("/api/v1/categories", categoriesRouter)

const port = parseInt(process.env.PORT) || 3000;
serve({
  fetch: app.fetch,
  port: port,
}, (info) => {
  console.log(`Server is running on port ${info.port}`);
});