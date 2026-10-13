import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    fullName: text("full_name"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const debates = sqliteTable("debates", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  mode: text("mode", { enum: ["bot", "friend"] }).notNull().default("bot"),
  motion: text("motion").notNull(),
  side: text("side", { enum: ["for", "against"] }).notNull(),
  status: text("status", { enum: ["draft", "active", "judged"] })
    .notNull()
    .default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const debateTurns = sqliteTable("debate_turns", {
  id: text("id").primaryKey(),
  debateId: text("debate_id")
    .notNull()
    .references(() => debates.id),
  speaker: text("speaker", { enum: ["user", "bot"] }).notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const scores = sqliteTable("scores", {
  id: text("id").primaryKey(),
  debateId: text("debate_id")
    .notNull()
    .references(() => debates.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  structure: integer("structure").notNull(),
  logic: integer("logic").notNull(),
  evidence: integer("evidence").notNull(),
  rebuttal: integer("rebuttal").notNull(),
  speakingStyle: integer("speaking_style").notNull(),
  overall: integer("overall").notNull(),
  rank: text("rank").notNull(),
  feedback: text("feedback").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
