import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { primaryKey } from "drizzle-orm/pg-core"; 

export const genres = t.pgTable("genres", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  title: t.varchar({ length: 255 }).notNull(),
});
export const booksCategories = t.pgTable("books_categories", {
  bookId: t.bigint("book_id", { mode: "number" })
    .references(() => books.id, { onDelete: "cascade" }),
  categoryId: t.bigint("category_id", { mode: "number" })
    .references(() => categories.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.bookId, table.categoryId] }),
}));

export const categories = t.pgTable("categories", {
  id: t.bigserial("id", { mode: "number" }).primaryKey(),
  title: t.varchar("title", { length: 255 }).notNull(),
});


export const books = t.pgTable("books", {
  id: t.bigserial("id", { mode: "number" }).primaryKey(),
  title: t.varchar("title", { length: 255 }).notNull(),
  author: t.varchar("author", { length: 255 }).notNull(),
  publishedAt: t.timestamp("published_at").notNull(),
  detail: t.text("detail"),
  synopsis: t.text("synopsis"),   // map ชื่อคอลัมน์
  genreId: t.bigint("genre_id", { mode: "number" })     // map ชื่อคอลัมน์
    .references(() => genres.id, { onDelete: "set null" }),
});


export const bookRelations = relations(books, ({ one }) => ({
  genre: one(genres, {
    fields: [books.genreId],
    references: [genres.id],
  }),
}));
