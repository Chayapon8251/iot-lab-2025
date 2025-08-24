import { http } from "./http";

export type Book = {
  id: number;
  title: string;
  author: string;
  publishedAt: string;  // ISO string
  genreId?: number | null;
  detail?: string | null;
  synopsis?: string | null;
};

export const BooksAPI = {
  list: () => http.get<{ books?: Book[] } | Book[]>("/books"),
  get: (id: number) => http.get<{ book?: Book } | Book>(`/books/${id}`),
  create: (payload: Omit<Book, "id">) => http.post<{ book: Book }>("/books", payload),
  update: (id: number, payload: Partial<Omit<Book, "id">>) =>
    http.put<{ book: Book }>(`/books/${id}`, payload),
  remove: (id: number) => http.delete(`/books/${id}`),
};
