import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from 'hono/adapter';
import booksRouter from './books.js';
import drinksRouter from './drinks.js';
import ordersRouter from './orders.js';

const app = new Hono();
export default app;

// CORS ก่อนทุก route
app.use(
  '*',
  cors({
    origin: [
      'https://iot-lab-2025-11.onrender.com', // ✅ โดเมนหน้าเว็บที่ถูกต้อง
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'x-api-secret'], // ✅ ต้องมี header นี้
    maxAge: 86400,
  })
);

// auth แบบง่าย (ยกเว้น OPTIONS)
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next();
  const { API_SECRET = '1234' } = env<{ API_SECRET: string }>(c);
  const clientSecret = c.req.header('x-api-secret') ?? '';
  if (clientSecret !== API_SECRET) return c.text('Unauthorized', 401);
  return next();
});

// health
app.get('/health', (c) => c.text('ok'));

// ⚠️ ต้องประกาศ basePath ก่อนค่อยผูก route
const api = app.basePath('/api/v1');
api.route('/books', booksRouter);
api.route('/drinks', drinksRouter);
api.route('/orders', ordersRouter);
