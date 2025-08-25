import { Hono } from "hono";
import drizzle from "../db/drizzle.js";
import { drinks } from "../db/schema.js";
import { eq } from "drizzle-orm";

const r = new Hono();

// เมนูกาแฟ (เฉพาะรายการที่เปิดขาย)
r.get("/", async (c) => {
  const rows = await drizzle
    .select({
      id: drinks.id,
      name: drinks.name,
      priceCents: drinks.priceCents,
      isAvailable: drinks.isAvailable,
    })
    .from(drinks)
    .where(eq(drinks.isAvailable, true));
  return c.json(rows);
});

export default r;
