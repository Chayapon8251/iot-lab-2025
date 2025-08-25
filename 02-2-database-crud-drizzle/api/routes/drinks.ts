import { Hono } from "hono";

export const DRINKS = [
  { id: 1, name: "เอสเปรสโซ่", priceCents: 4500 },
  { id: 2, name: "อเมริกาโน่", priceCents: 4000 },
  { id: 3, name: "ลาเต้",       priceCents: 5500 },
  { id: 4, name: "คาปูชิโน่",   priceCents: 5500 },
  { id: 5, name: "มอคค่า",       priceCents: 6000 },
];

const router = new Hono();

router.get("/", (c) => c.json(DRINKS));

export default router;
