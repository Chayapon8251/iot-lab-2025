// api/routes/books.ts
import { Hono } from "hono";
import drizzle from "../db/drizzle.js";
import { books, categories, booksCategories } from "../db/schema.js";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";

const booksRouter = new Hono();

/* -------------------- Helpers -------------------- */
const zIsoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "invalid ISO date")
  .transform((s) => dayjs(s).toDate());

const zCategoryIds = z
  .array(z.union([z.number().int(), z.string().regex(/^\d+$/).transform(Number)]))
  .optional()
  .default([]);

/* -------------------- Public routes -------------------- */
booksRouter.get("/", async (c) => {
  // ถ้าต้องการ categories ด้วยทุกเล่มสามารถ join/aggregate เพิ่มได้
  const allBooks = await drizzle.select().from(books);
  return c.json(allBooks);
});

booksRouter.get("/:id", async (c) => {
  const rawId = c.req.param("id");
  const id = Number(rawId);
  if (!Number.isFinite(id)) {
    return c.json({ error: "Invalid id" }, 400);
  }

  try {
    // 1) ดึงหนังสือ (จะมี detail/synopsis ถ้าคอลัมน์อยู่จริง)
    const [book] = await drizzle.select().from(books).where(eq(books.id, id)).limit(1);
    if (!book) return c.json({ error: "Book not found" }, 404);

    // 2) ดึงหมวดหมู่แบบ "ไม่ทำให้ route ล้ม" (กันกรณี import/schema ผิด)
    let cats: { id: number; title: string }[] = [];
    try {
      cats = await drizzle
        .select({ id: categories.id, title: categories.title })
        .from(booksCategories)
        .innerJoin(categories, eq(booksCategories.categoryId, categories.id))
        .where(eq(booksCategories.bookId, id));
    } catch (e) {
      console.error("[WARN] Fetch categories failed:", e);
      cats = []; // ส่ง [] แทน
    }

    return c.json({ book, categories: cats });
  } catch (e: any) {
    console.error("[ERROR] GET /books/:id failed:", e);
    return c.json({ error: "Internal Server Error", detail: String(e?.message ?? e) }, 500);
  }
});

/* -------------------- Protected-ish (ถ้าจะเปิด bearer ให้ย้ายมา use ภายหลัง) -------------------- */
const createBody = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  publishedAt: zIsoDate,
  genreId: z.number().int().optional().nullable(),
  detail: z.string().optional().nullable(),
  synopsis: z.string().optional().nullable(),
  categoryIds: zCategoryIds, // [1,2,3]
});

booksRouter.post("/", zValidator("json", createBody), async (c) => {
  const body = c.req.valid("json");
  const ids = (body.categoryIds ?? []).filter((x) => Number.isFinite(x));
  // ใช้ transaction: สร้างหนังสือ -> แนบหมวดหมู่
  const created = await drizzle.transaction(async (tx) => {
    const [b] = await tx
      .insert(books)
      .values({
        title: body.title,
        author: body.author,
        publishedAt: body.publishedAt,
        genreId: body.genreId ?? null,
        detail: body.detail ?? null,
        synopsis: body.synopsis ?? null,
      })
      .returning({
        id: books.id,
        title: books.title,
        author: books.author,
        publishedAt: books.publishedAt,
        genreId: books.genreId,
        detail: books.detail,
        synopsis: books.synopsis,
      });

if (ids.length) {
  const existing = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.id, ids));
  const validIds = existing.map((x) => x.id);

  if (validIds.length) {
    await tx
      .insert(booksCategories)
      .values(validIds.map((cid) => ({ bookId: b.id, categoryId: cid })))
      .onConflictDoNothing();
  }
}
    return b;
  });

  return c.json({ success: true, book: created }, 201);
});

const patchBody = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  publishedAt: zIsoDate.optional(),
  genreId: z.number().int().nullable().optional(),
  detail: z.string().nullable().optional(),
  synopsis: z.string().nullable().optional(),
  categoryIds: zCategoryIds.optional(), // ส่งมาก็จะ replace ความสัมพันธ์
});

booksRouter.patch("/:id", zValidator("json", patchBody), async (c) => {
  const id = Number(c.req.param("id"));
  const body = c.req.valid("json");

  const updated = await drizzle.transaction(async (tx) => {
    // อัปเดตคอลัมน์ใน books
    const setData: any = {};
    if (body.title !== undefined) setData.title = body.title;
    if (body.author !== undefined) setData.author = body.author;
    if (body.publishedAt !== undefined) setData.publishedAt = body.publishedAt;
    if (body.genreId !== undefined) setData.genreId = body.genreId;
    if (body.detail !== undefined) setData.detail = body.detail;
    if (body.synopsis !== undefined) setData.synopsis = body.synopsis;

    const res = Object.keys(setData).length
      ? await tx.update(books).set(setData).where(eq(books.id, id)).returning()
      : await tx.select().from(books).where(eq(books.id, id)).limit(1);

    if (res.length === 0) return null;

    // ถ้ามี categoryIds → replace ความสัมพันธ์ทั้งหมด
    if (body.categoryIds) {
      await tx.delete(booksCategories).where(eq(booksCategories.bookId, id));
      if (body.categoryIds.length) {
        const existing = await tx
          .select({ id: categories.id })
          .from(categories)
          .where(inArray(categories.id, body.categoryIds));
        const validIds = existing.map((x) => x.id);
        if (validIds.length) {
          await tx
            .insert(booksCategories)
            .values(validIds.map((cid) => ({ bookId: id, categoryId: cid })))
            .onConflictDoNothing();
        }
      }
    }

    return res[0];
  });

  if (!updated) return c.json({ error: "Book not found" }, 404);
  return c.json({ success: true, book: updated });
});

booksRouter.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await drizzle.delete(books).where(eq(books.id, id)).returning();
  if (deleted.length === 0) return c.json({ error: "Book not found" }, 404);
  return c.json({ success: true, book: deleted[0] });
});

export default booksRouter;
