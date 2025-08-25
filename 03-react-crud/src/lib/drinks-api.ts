import { http } from "./http";

export type Drink = {
  id: number;
  name: string;
  priceCents: number; // ราคาเป็นสตางค์
};

export const DrinksAPI = {
  // GET /api/v1/drinks  ->  Drink[]
  list: () => http.get<Drink[]>("/drinks"),
};

