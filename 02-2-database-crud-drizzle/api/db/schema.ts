import * as t from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";

/* 1) ประกาศ table ที่เป็นเป้าของ FK ก่อน */
export const genres = t.pgTable("genres", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  title: t.varchar({ length: 255 }).notNull(),
});

export const categories = t.pgTable("categories", {
  id: t.bigserial("id", { mode: "number" }).primaryKey(),
  title: t.varchar("title", { length: 255 }).notNull(),
});

/* 2) books อ้าง genres */
export const books = t.pgTable("books", {
  id: t.bigserial("id", { mode: "number" }).primaryKey(),
  title: t.varchar("title", { length: 255 }).notNull(),
  author: t.varchar("author", { length: 255 }).notNull(),
  publishedAt: t.timestamp("published_at").notNull(),
  detail: t.text("detail"),
  synopsis: t.text("synopsis"),
  genreId: t
    .bigint("genre_id", { mode: "number" })
    .references(() => genres.id, { onDelete: "set null" }),
});

/* 3) ตารางเชื่อม many-to-many อ้างทั้ง books และ categories */
export const booksCategories = t.pgTable(
  "books_categories",
  {
    bookId: t
      .bigint("book_id", { mode: "number" })
      .references(() => books.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: t
      .bigint("category_id", { mode: "number" })
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.bookId, table.categoryId] }),
  })
);

export const bookRelations = relations(books, ({ one }) => ({
  genre: one(genres, {
    fields: [books.genreId],
    references: [genres.id],
  }),
}));
