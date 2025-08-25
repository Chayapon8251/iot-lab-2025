import { http } from "./http";
export type Drink = { id: number; name: string; priceCents: number; isAvailable: boolean };
export const DrinksAPI = { list: () => http.get<Drink[]>("/drinks") };
