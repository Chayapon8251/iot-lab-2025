import { http } from "./http";

export type CreateOrderItem = { drinkId: number; qty: number; note?: string | null };
export type CreateOrderBody = { note?: string | null; items: CreateOrderItem[] };

export const OrdersAPI = {
  create: (body: CreateOrderBody) => http.post<{ success: true; orderId: number }>("/orders", body),
  list:   () => http.get<any[]>("/orders"),
  setStatus: (id: number, status: "pending"|"preparing"|"done"|"cancelled") =>
    http.patch(`/orders/${id}/status`, { status }),
};
