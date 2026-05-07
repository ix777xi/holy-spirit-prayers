import { users, userPrayers } from '@shared/schema';
import type { User, InsertUser, UserPrayer } from '@shared/schema';
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Ensure required tables exist (no migration tooling at runtime)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT '',
    google_id TEXT,
    email TEXT,
    name TEXT,
    picture_url TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS uploaded_prayers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    audio_filename TEXT NOT NULL,
    audio_original_name TEXT NOT NULL DEFAULT '',
    audio_mime_type TEXT NOT NULL DEFAULT 'audio/mpeg',
    audio_size INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_prayers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    prayer_key TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    category_slug TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    audio_url TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 0,
    feedback TEXT NOT NULL DEFAULT '',
    selected_at TEXT NOT NULL,
    downloaded_at TEXT,
    download_count INTEGER NOT NULL DEFAULT 0
  );
  CREATE UNIQUE INDEX IF NOT EXISTS user_prayers_user_source_key_idx
    ON user_prayers (user_id, source, prayer_key);
`);

// Backfill columns added after initial deploys (best-effort no-ops if present)
function tryAddColumn(sql: string) {
  try { sqlite.exec(sql); } catch { /* ignore: column already exists */ }
}
tryAddColumn(`ALTER TABLE users ADD COLUMN google_id TEXT;`);
tryAddColumn(`ALTER TABLE users ADD COLUMN email TEXT;`);
tryAddColumn(`ALTER TABLE users ADD COLUMN name TEXT;`);
tryAddColumn(`ALTER TABLE users ADD COLUMN picture_url TEXT;`);
tryAddColumn(`ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT '';`);

export const db = drizzle(sqlite);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    pictureUrl?: string;
  }): Promise<User>;
  listUserPrayers(userId: number): Promise<UserPrayer[]>;
  getUserPrayer(userId: number, source: string, prayerKey: string): Promise<UserPrayer | undefined>;
  upsertUserPrayer(input: {
    userId: number;
    source: string;
    prayerKey: string;
    title: string;
    categorySlug: string;
    description: string;
    audioUrl: string;
  }): Promise<UserPrayer>;
  updateUserPrayer(
    userId: number,
    id: number,
    patch: Partial<Pick<UserPrayer, "rating" | "feedback" | "downloadedAt" | "downloadCount">>,
  ): Promise<UserPrayer | undefined>;
  deleteUserPrayer(userId: number, id: number): Promise<boolean>;
  recordDownload(userId: number, id: number): Promise<UserPrayer | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.googleId, googleId)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }

  async upsertGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    pictureUrl?: string;
  }): Promise<User> {
    const existing = await this.getUserByGoogleId(profile.googleId);
    if (existing) {
      const updated = db
        .update(users)
        .set({
          email: profile.email,
          name: profile.name,
          pictureUrl: profile.pictureUrl ?? existing.pictureUrl ?? null,
        })
        .where(eq(users.id, existing.id))
        .returning()
        .get();
      return updated ?? existing;
    }
    const baseUsername = (profile.email || `google_${profile.googleId}`).toLowerCase();
    let username = baseUsername;
    let suffix = 0;
    while (await this.getUserByUsername(username)) {
      suffix += 1;
      username = `${baseUsername}+${suffix}`;
    }
    return db
      .insert(users)
      .values({
        username,
        password: "",
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        pictureUrl: profile.pictureUrl ?? null,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async listUserPrayers(userId: number): Promise<UserPrayer[]> {
    return db
      .select()
      .from(userPrayers)
      .where(eq(userPrayers.userId, userId))
      .orderBy(desc(userPrayers.selectedAt))
      .all();
  }

  async getUserPrayer(userId: number, source: string, prayerKey: string): Promise<UserPrayer | undefined> {
    return db
      .select()
      .from(userPrayers)
      .where(
        and(
          eq(userPrayers.userId, userId),
          eq(userPrayers.source, source),
          eq(userPrayers.prayerKey, prayerKey),
        ),
      )
      .get();
  }

  async upsertUserPrayer(input: {
    userId: number;
    source: string;
    prayerKey: string;
    title: string;
    categorySlug: string;
    description: string;
    audioUrl: string;
  }): Promise<UserPrayer> {
    const existing = await this.getUserPrayer(input.userId, input.source, input.prayerKey);
    if (existing) {
      const updated = db
        .update(userPrayers)
        .set({
          title: input.title || existing.title,
          categorySlug: input.categorySlug || existing.categorySlug,
          description: input.description || existing.description,
          audioUrl: input.audioUrl || existing.audioUrl,
        })
        .where(eq(userPrayers.id, existing.id))
        .returning()
        .get();
      return updated ?? existing;
    }
    return db
      .insert(userPrayers)
      .values({
        userId: input.userId,
        source: input.source,
        prayerKey: input.prayerKey,
        title: input.title,
        categorySlug: input.categorySlug,
        description: input.description,
        audioUrl: input.audioUrl,
        selectedAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async updateUserPrayer(
    userId: number,
    id: number,
    patch: Partial<Pick<UserPrayer, "rating" | "feedback" | "downloadedAt" | "downloadCount">>,
  ): Promise<UserPrayer | undefined> {
    return db
      .update(userPrayers)
      .set(patch)
      .where(and(eq(userPrayers.id, id), eq(userPrayers.userId, userId)))
      .returning()
      .get();
  }

  async deleteUserPrayer(userId: number, id: number): Promise<boolean> {
    const out = db
      .delete(userPrayers)
      .where(and(eq(userPrayers.id, id), eq(userPrayers.userId, userId)))
      .run();
    return out.changes > 0;
  }

  async recordDownload(userId: number, id: number): Promise<UserPrayer | undefined> {
    const existing = db
      .select()
      .from(userPrayers)
      .where(and(eq(userPrayers.id, id), eq(userPrayers.userId, userId)))
      .get();
    if (!existing) return undefined;
    return db
      .update(userPrayers)
      .set({
        downloadedAt: new Date().toISOString(),
        downloadCount: (existing.downloadCount || 0) + 1,
      })
      .where(eq(userPrayers.id, id))
      .returning()
      .get();
  }
}

export const storage = new DatabaseStorage();
