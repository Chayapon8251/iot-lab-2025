// src/lib/categories-api.ts
import { http } from "./http";
export type Category = { id: number; title: string };
export const CategoriesAPI = {
  list: () => http.get<Category[]>("/categories"),
};
