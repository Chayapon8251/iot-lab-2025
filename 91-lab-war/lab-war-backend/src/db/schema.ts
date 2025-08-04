import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

export const teams = t.pgTable("teams", {
  id: t.serial("id").primaryKey(),
  name: t.varchar("name", { length: 255 }).notNull(),
});

export const users = t.pgTable("users", {
  id: t.serial("id").primaryKey(),
  username: t.varchar("username", { length: 255 }).notNull(),
  password: t.varchar("password", { length: 1024 }).notNull(),
  teamId: t
    .integer("team_id")
    .references(() => teams.id)
    .notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
}));
