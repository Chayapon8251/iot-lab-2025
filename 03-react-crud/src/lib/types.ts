// src/lib/types.ts
export type Book = {
  id: number;
  title: string;
  author: string;
  publishedAt: string;      // ISO string
  genreId?: number | null;
  detail?: string | null;
  synopsis?: string | null;
};
