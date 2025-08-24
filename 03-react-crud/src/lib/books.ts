// src/lib/books.ts
import { api } from './api';
import type { Book } from './types';

export const BookAPI = {
  list: () => api.get<{ success?: boolean; books?: Book[] } | Book[]>('/books'),
  get: (id: number) =>
    api.get<{ success?: boolean; book?: Book } | Book>(`/books/${id}`),
  create: (b: Omit<Book, 'id'>) =>
    api.post<{ success?: boolean; book?: Book } | Book>('/books', b),
  update: (id: number, b: Partial<Omit<Book, 'id'>>) =>
    api.put<{ success?: boolean; book?: Book } | Book>(`/books/${id}`, b),
  remove: (id: number) => api.del<{ success: boolean }>(`/books/${id}`),
};
