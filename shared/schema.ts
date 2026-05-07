import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull().default(""),
  email: text("email"),
  name: text("name"),
  pictureUrl: text("picture_url"),
  createdAt: text("created_at").notNull().default(""),
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

// User-saved prayer records.
// `source` is "seed" for built-in prayers or "uploaded" for admin uploads.
// `prayerKey` stores the slug (seed) or numeric id as string (uploaded).
export const userPrayers = sqliteTable(
  "user_prayers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull(),
    source: text("source").notNull(),
    prayerKey: text("prayer_key").notNull(),
    title: text("title").notNull().default(""),
    categorySlug: text("category_slug").notNull().default(""),
    description: text("description").notNull().default(""),
    audioUrl: text("audio_url").notNull().default(""),
    rating: integer("rating").notNull().default(0),
    feedback: text("feedback").notNull().default(""),
    selectedAt: text("selected_at").notNull(),
    downloadedAt: text("downloaded_at"),
    downloadCount: integer("download_count").notNull().default(0),
  },
  (t) => ({
    uniqUserPrayer: uniqueIndex("user_prayers_user_source_key_idx").on(
      t.userId,
      t.source,
      t.prayerKey,
    ),
  }),
);

export type UserPrayer = typeof userPrayers.$inferSelect;
