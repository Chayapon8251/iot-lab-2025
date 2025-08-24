import { http } from "./http";

export type Category = { id: number; title: string };

export const CategoriesAPI = {
  list: () => http.get<{ categories?: Category[] } | Category[]>("/categories"),
  create: (title: string) => http.post<{ category: Category }>("/categories", { title }),
};
