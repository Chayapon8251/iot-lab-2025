import { Hono } from "hono";
import { DRINKS } from "./drinks.js";

type Status = "pending" | "preparing" | "done" | "cancelled";
type Item   = { drinkId: number; qty: number; note: string | null };
type Order  = { id: number; createdAt: string; note: string | null; status: Status; items: Item[] };

let seq = 1;
const store: Order[] = [];

const router = new Hono();

// สร้างออเดอร์
router.post("/", async (c) => {
  const body = (await c.req.json()) as { note: string | null; items: Item[] };
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ error: "no items" }, 400);
  }

  const order: Order = {
    id: seq++,
    createdAt: new Date().toISOString(),
    note: body.note ?? null,
    status: "pending",
    items: body.items.map((i) => ({
      drinkId: Number(i.drinkId),
      qty: Number(i.qty),
      note: i.note ?? null,
    })),
  };

  store.push(order);
  return c.json({ success: true, orderId: order.id }, 201);
});

// ดึงรายการ (แปลงเป็นรูปแบบที่หน้า Staff ใช้)
router.get("/", (c) => {
  const out = [...store].reverse().map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    note: o.note,
    status: o.status,
    items: o.items.map((it) => {
      const d = DRINKS.find((x) => x.id === it.drinkId);
      return {
        drinkId: it.drinkId,
        drinkName: d?.name ?? `#${it.drinkId}`,
        unitPriceCents: d?.priceCents ?? 0,
        qty: it.qty,
        itemNote: it.note,
      };
    }),
  }));
  return c.json(out);
});

// เปลี่ยนสถานะออเดอร์
router.patch("/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return c.json({ error: "bad id" }, 400);

  const body = (await c.req.json()) as { status?: Status };
  const allowed: Status[] = ["pending", "preparing", "done", "cancelled"];
  if (!body.status || !allowed.includes(body.status)) {
    return c.json({ error: "bad status" }, 400);
  }

  const order = store.find((o) => o.id === id);
  if (!order) return c.json({ error: "not found" }, 404);

  order.status = body.status;
  return c.json({ success: true, status: order.status });
});

export default router;
