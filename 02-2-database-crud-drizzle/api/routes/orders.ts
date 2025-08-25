import { Hono } from "hono";
import drizzle from "../db/drizzle.js";
import { drinks, orders, orderItems } from "../db/schema.js";
import { inArray, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const r = new Hono();

// สร้างคำสั่งซื้อ
const createOrderBody = z.object({
  note: z.string().max(500).optional().nullable(),
  items: z.array(
    z.object({
      drinkId: z.number().int(),
      qty: z.number().int().positive().max(99),
      note: z.string().max(200).optional().nullable(),
    })
  ).min(1),
});

r.post("/", zValidator("json", createOrderBody), async (c) => {
  const body = c.req.valid("json");

  // ดึงราคา ณ ปัจจุบัน
  const ids = body.items.map(i => i.drinkId);
  const menu = await drizzle.select().from(drinks).where(inArray(drinks.id, ids));

  // map id -> price
  const priceMap = new Map(menu.map(m => [m.id!, m.priceCents!]));

  const created = await drizzle.transaction(async (tx) => {
    const [o] = await tx.insert(orders).values({
      note: body.note ?? null,
      status: "pending",
    }).returning({ id: orders.id, createdAt: orders.createdAt });

    // บันทึกรายการ
    const rows = body.items.map(it => ({
      orderId: o.id,
      drinkId: it.drinkId,
      qty: it.qty,
      unitPriceCents: priceMap.get(it.drinkId) ?? 0,
      note: it.note ?? null,
    }));
    await tx.insert(orderItems).values(rows);

    return o;
  });

  return c.json({ success: true, orderId: created.id, createdAt: created.createdAt }, 201);
});

// สำหรับ Staff: ดูรายการคำสั่งซื้อ (ล่าสุดก่อน)
r.get("/", async (c) => {
  const os = await drizzle.select().from(orders).orderBy(desc(orders.createdAt)).limit(50);

  // ดึง items ทั้งหมดในชุดเดียว
  const orderIds = os.map(o => o.id);
  let items: any[] = [];
  if (orderIds.length) {
    items = await drizzle
      .select({
        orderId: orderItems.orderId,
        drinkId: orderItems.drinkId,
        qty: orderItems.qty,
        unitPriceCents: orderItems.unitPriceCents,
        itemNote: orderItems.note,
        drinkName: drinks.name,
      })
      .from(orderItems)
      .innerJoin(drinks, eq(orderItems.drinkId, drinks.id))
      .where(inArray(orderItems.orderId, orderIds));
  }

  // grouping
  const grouped: Record<number, any[]> = {};
  for (const it of items) {
    (grouped[it.orderId] ??= []).push(it);
  }

  return c.json(os.map(o => ({ ...o, items: grouped[o.id] ?? [] })));
});

// อัปเดตสถานะ (ตัวเลือก)
const patchStatusBody = z.object({
  status: z.enum(["pending", "preparing", "done", "cancelled"]),
});
r.patch("/:id/status", zValidator("json", patchStatusBody), async (c) => {
  const id = Number(c.req.param("id"));
  const { status } = c.req.valid("json");
  const res = await drizzle.update(orders).set({ status }).where(eq(orders.id, id)).returning();
  if (res.length === 0) return c.json({ error: "Order not found" }, 404);
  return c.json({ success: true, order: res[0] });
});

export default r;
