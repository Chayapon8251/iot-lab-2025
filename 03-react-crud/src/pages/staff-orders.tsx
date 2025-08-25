import { useEffect, useState } from "react";
import Layout from "../components/layout";
import { OrdersAPI } from "../lib/orders-api";
import { Container, Card, Group, Badge, Button, Text, Stack } from "@mantine/core";
import dayjs from "dayjs";

const baht = (cents: number) => `฿${(cents/100).toFixed(2)}`;

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const load = () => OrdersAPI.list().then(r => setOrders(r.data));
  useEffect(() => { load(); }, []);

  const setStatus = async (id: number, status: "pending"|"preparing"|"done"|"cancelled") => {
    await OrdersAPI.setStatus(id, status);
    await load();
  };

  return (
    <Layout>
      <Container className="mt-8 pb-24">
        <Group justify="space-between" mb="md">
          <h1 className="text-2xl font-bold">Staff – รายการสั่งล่าสุด</h1>
          <Button variant="light" onClick={load}>รีเฟรช</Button>
        </Group>

        <Stack gap="md">
          {orders.map(o => (
            <Card key={o.id} withBorder>
              <Group justify="space-between">
                <Group gap="xs">
                  <Text fw={600}>Order #{o.id}</Text>
                  <Badge>{o.status}</Badge>
                </Group>
                <Text c="dimmed">{dayjs(o.createdAt).format("DD/MM/YYYY HH:mm")}</Text>
              </Group>

              {o.note && <Text mt="xs">หมายเหตุรวม: {o.note}</Text>}

              <ul className="mt-2 ml-5 list-disc">
                {o.items.map((it: any, idx: number) => (
                  <li key={idx}>
                    {it.drinkName} × {it.qty} — <Text component="span" c="dimmed">{baht(it.unitPriceCents)}</Text>
                    {it.itemNote ? <> — <Text component="span">{it.itemNote}</Text></> : null}
                  </li>
                ))}
              </ul>

              <Group mt="md">
                <Button size="compact-sm" onClick={() => setStatus(o.id, "preparing")}>กำลังทำ</Button>
                <Button size="compact-sm" color="teal" onClick={() => setStatus(o.id, "done")}>เสร็จแล้ว</Button>
                <Button size="compact-sm" color="red" variant="light" onClick={() => setStatus(o.id, "cancelled")}>ยกเลิก</Button>
              </Group>
            </Card>
          ))}
        </Stack>
      </Container>
    </Layout>
  );
}
