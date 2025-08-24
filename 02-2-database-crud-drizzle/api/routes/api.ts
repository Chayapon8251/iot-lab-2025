import { Hono } from "hono";
import { cors } from 'hono/cors';
import booksRouter from "./books.js";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";

// const apiRouter = new Hono();

const app = new Hono();
export default app;

// ✅ CORS ต้องประกาศก่อน route ทั้งหมด
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
  // credentials: false, // ใช้ header Authorization ธรรมดา ไม่ต้องเปิด credentials
}));

app.route('/books', booksRouter);
// (ถ้ามี basePath)
// app.basePath('/api/v1');

// (ถ้ามี middleware ตรวจ Authorization ทั่วระบบ ให้ "ยกเว้น OPTIONS")
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next(); // อย่าบล็อกพรีไฟลต์
  // ...ตรวจ Authorization: 1234 ตามเดิม...
  return next();
});

// routes ของคุณ ...
app.get('/health', (c) => c.text('ok'));