import { users } from '@shared/schema';
import type { User, InsertUser } from '@shared/schema';
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Ensure required tables exist (no migration tooling at runtime)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
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
`);

export const db = drizzle(sqlite);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }
}

export const storage = new DatabaseStorage();
