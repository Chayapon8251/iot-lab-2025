// api/routes/categories.ts
import { Hono } from "hono";
import drizzle from "../db/drizzle.js";
import { categories } from "../db/schema.js";

const categoriesRouter = new Hono();

// *** สำคัญ: ใช้ "/" ไม่ใช่ "/categories"
categoriesRouter.get("/", async (c) => {
  const rows = await drizzle
    .select({ id: categories.id, title: categories.title })
    .from(categories)
    .orderBy(categories.id);
  return c.json(rows);
});

export default categoriesRouter;
