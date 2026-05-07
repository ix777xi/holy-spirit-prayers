import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const uploadedPrayers = sqliteTable("uploaded_prayers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  categorySlug: text("category_slug").notNull(),
  description: text("description").notNull().default(""),
  audioFilename: text("audio_filename").notNull(),
  audioOriginalName: text("audio_original_name").notNull().default(""),
  audioMimeType: text("audio_mime_type").notNull().default("audio/mpeg"),
  audioSize: integer("audio_size").notNull().default(0),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export type UploadedPrayer = typeof uploadedPrayers.$inferSelect;
