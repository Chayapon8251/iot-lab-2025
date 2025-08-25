import { http } from "./http";

export type OrderItemInput = { drinkId: number; qty: number; note: string | null };
export type CreateOrderInput = { note: string | null; items: OrderItemInput[] };

export type StaffOrderItem = {
  drinkId: number;
  drinkName: string;
  unitPriceCents: number;
  qty: number;
  itemNote: string | null;
};

export type StaffOrder = {
  id: number;
  createdAt: string;
  note: string | null;
  status: "pending" | "preparing" | "done" | "cancelled";
  items: StaffOrderItem[];
};

export const OrdersAPI = {
  create: (payload: CreateOrderInput) =>
    http.post<{ success: true; orderId: number }>("/orders", payload),

  list: () => http.get<StaffOrder[]>("/orders"),

  setStatus: (id: number, status: "pending" | "preparing" | "done" | "cancelled") =>
    http.patch<{ success: true; status: string }>(`/orders/${id}/status`, { status }),
};
