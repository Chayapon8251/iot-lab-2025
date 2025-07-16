import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/sqlite-core";

export const genres = t.sqliteTable("genres", {
  id: t.integer().primaryKey({
    autoIncrement: true,
  }),
  title: t.text().notNull(),
});

export const books = t.sqliteTable("books", {
  id: t.integer().primaryKey({
    autoIncrement: true,
  }),
  title: t.text().notNull(),
  author: t.text().notNull(),
  publishedAt: t.integer().notNull(),

  genreId: t.integer().references(() => genres.id, {
    onDelete: "set null",
  }),
});

export const bookRelations = relations(books, ({ one }) => ({
  genre: one(genres, {
    fields: [books.genreId],
    references: [genres.id],
  }),
}));
