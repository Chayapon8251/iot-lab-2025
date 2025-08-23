// drizzle.ts
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // ใช้ URL จาก .env ของคุณ
  ssl: { rejectUnauthorized: false },         // Render บังคับ SSL
});

export const db = drizzle(pool, { schema });
export default db;
