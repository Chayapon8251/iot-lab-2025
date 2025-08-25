import { useEffect, useState } from "react";
import Layout from "../components/layout";
import { DrinksAPI, type Drink } from "../lib/drinks-api";
import { OrdersAPI } from "../lib/orders-api";
import { Container, Table, NumberInput, Textarea, Button, Group, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";

type ItemState = { qty: number; note: string };

const baht = (cents: number) => `฿${(cents/100).toFixed(2)}`;

export default function CoffeeMenuPage() {
  const [menu, setMenu] = useState<Drink[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [items, setItems] = useState<Record<number, ItemState>>({}); // drinkId -> {qty,note}
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    DrinksAPI.list().then(res => setMenu(res.data)).catch(() => setMenu([]));
  }, []);

  const setQty = (id: number, qty: number) =>
    setItems(s => ({ ...s, [id]: { qty: Math.max(0, qty||0), note: s[id]?.note ?? "" } }));

  const setNote = (id: number, note: string) =>
    setItems(s => ({ ...s, [id]: { qty: s[id]?.qty ?? 0, note } }));

  const submit = async () => {
    const payloadItems = Object.entries(items)
      .map(([id, st]) => ({ drinkId: Number(id), qty: st.qty, note: st.note?.trim() || null }))
      .filter(i => i.qty > 0);

    if (payloadItems.length === 0) {
      notifications.show({ color: "red", title: "ยังไม่ได้เลือกเครื่องดื่ม", message: "โปรดใส่จำนวนอย่างน้อย 1 รายการ" });
      return;
    }

    try {
      setLoading(true);
      const res = await OrdersAPI.create({ note: orderNote.trim() || null, items: payloadItems });
      notifications.show({ color: "teal", title: "สั่งซื้อสำเร็จ", message: `หมายเลขออเดอร์ #${res.data.orderId}` });
      // reset
      setItems({});
      setOrderNote("");
    } catch (e: any) {
      notifications.show({ color: "red", title: "สั่งซื้อไม่สำเร็จ", message: e?.message ?? "ลองใหม่อีกครั้ง" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container className="mt-8 pb-24">
        <h1 className="text-2xl font-bold">เมนูกาแฟ</h1>

        <Table striped highlightOnHover withTableBorder className="mt-4">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>เมนู</Table.Th>
              <Table.Th>ราคา</Table.Th>
              <Table.Th style={{ width: 160 }}>จำนวน</Table.Th>
              <Table.Th>หมายเหตุ (ต่อรายการ)</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {menu.map(d => (
              <Table.Tr key={d.id}>
                <Table.Td>{d.name}</Table.Td>
                <Table.Td>{baht(d.priceCents)}</Table.Td>
                <Table.Td>
                  <NumberInput
                    min={0}
                    value={items[d.id]?.qty ?? 0}
                    onChange={(v) => setQty(d.id, Number(v))}
                  />
                </Table.Td>
                <Table.Td>
                  <Textarea
                    autosize minRows={1} maxRows={3}
                    placeholder="หวานน้อย / ไม่ใส่นม ฯลฯ"
                    value={items[d.id]?.note ?? ""}
                    onChange={(e) => setNote(d.id, e.currentTarget.value)}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <div className="mt-6">
          <Text fw={600}>หมายเหตุรวม (ทั้งออเดอร์)</Text>
          <Textarea
            className="mt-2"
            autosize minRows={2}
            value={orderNote}
            onChange={(e) => setOrderNote(e.currentTarget.value)}
            placeholder="เช่น ใส่หลอดเพิ่ม 2 อัน ส่งที่โต๊ะ B2"
          />
        </div>

        <Group className="mt-6">
          <Button onClick={submit} loading={loading}>สั่งเครื่องดื่ม</Button>
        </Group>
      </Container>
    </Layout>
  );
}

