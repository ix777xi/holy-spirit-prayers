import { users, userPrayers, prayerPurchases, userSubscriptions } from '@shared/schema';
import type {
  User,
  InsertUser,
  UserPrayer,
  PrayerPurchase,
  UserSubscription,
} from '@shared/schema';
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc, inArray } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Ensure required tables exist (no migration tooling at runtime)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT '',
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
    bible_theme TEXT NOT NULL DEFAULT '',
    supporting_scripture TEXT NOT NULL DEFAULT '',
    about_prayer TEXT NOT NULL DEFAULT '',
    whats_included TEXT NOT NULL DEFAULT '',
    scripture_quote TEXT NOT NULL DEFAULT '',
    scripture_reference TEXT NOT NULL DEFAULT '',
    category_description TEXT NOT NULL DEFAULT '',
    audio_filename TEXT NOT NULL,
    audio_original_name TEXT NOT NULL DEFAULT '',
    audio_mime_type TEXT NOT NULL DEFAULT 'audio/mpeg',
    audio_size INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    is_free INTEGER NOT NULL DEFAULT 0,
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
  CREATE TABLE IF NOT EXISTS prayer_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    uploaded_prayer_id INTEGER NOT NULL,
    stripe_session_id TEXT NOT NULL DEFAULT '',
    stripe_payment_intent_id TEXT NOT NULL DEFAULT '',
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'paid',
    created_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS prayer_purchases_user_prayer_idx
    ON prayer_purchases (user_id, uploaded_prayer_id);
  CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stripe_customer_id TEXT NOT NULL DEFAULT '',
    stripe_subscription_id TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    current_period_end TEXT NOT NULL DEFAULT '',
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT ''
  );
  CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_stripe_sub_idx
    ON user_subscriptions (stripe_subscription_id);
`);

// Backfill columns added after initial deploys (best-effort no-ops if present)
function tryAddColumn(sql: string) {
  try { sqlite.exec(sql); } catch { /* ignore: column already exists */ }
}
tryAddColumn(`ALTER TABLE users ADD COLUMN email TEXT;`);
tryAddColumn(`ALTER TABLE users ADD COLUMN name TEXT;`);
tryAddColumn(`ALTER TABLE users ADD COLUMN picture_url TEXT;`);
tryAddColumn(`ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT '';`);
tryAddColumn(`ALTER TABLE uploaded_prayers ADD COLUMN bible_theme TEXT NOT NULL DEFAULT '';`);
tryAddColumn(`ALTER TABLE uploaded_prayers ADD COLUMN supporting_scripture TEXT NOT NULL DEFAULT '';`);
tryAddColumn(`ALTER TABLE uploaded_prayers ADD COLUMN about_prayer TEXT NOT NULL DEFAULT '';`);
tryAddColumn(`ALTER TABLE uploaded_prayers ADD COLUMN whats_included TEXT NOT NULL DEFAULT '';`);
tryAddColumn(`ALTER TABLE uploaded_prayers ADD COLUMN scripture_quote TEXT NOT NULL DEFAULT '';`);
tryAddColumn(`ALTER TABLE uploaded_prayers ADD COLUMN scripture_reference TEXT NOT NULL DEFAULT '';`);
tryAddColumn(`ALTER TABLE uploaded_prayers ADD COLUMN category_description TEXT NOT NULL DEFAULT '';`);
tryAddColumn(`ALTER TABLE uploaded_prayers ADD COLUMN is_free INTEGER NOT NULL DEFAULT 0;`);

export const db = drizzle(sqlite);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLocalUser(input: {
    email: string;
    name: string;
    passwordHash: string;
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
  hasActiveSubscription(userId: number): Promise<boolean>;
  getActiveSubscription(userId: number): Promise<UserSubscription | undefined>;
  hasPurchasedPrayer(userId: number, uploadedPrayerId: number): Promise<boolean>;
  listUserPurchases(userId: number): Promise<PrayerPurchase[]>;
  recordPrayerPurchase(input: {
    userId: number;
    uploadedPrayerId: number;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    amountCents?: number;
    currency?: string;
  }): Promise<PrayerPurchase>;
  upsertSubscription(input: {
    userId: number;
    stripeCustomerId?: string;
    stripeSubscriptionId: string;
    status: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  }): Promise<UserSubscription>;
  setSubscriptionStatusByStripeId(
    stripeSubscriptionId: string,
    status: string,
    extra?: { currentPeriodEnd?: string; cancelAtPeriodEnd?: boolean },
  ): Promise<UserSubscription | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }

  async createLocalUser(input: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User> {
    const baseUsername = input.email.toLowerCase();
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
        password: input.passwordHash,
        email: input.email,
        name: input.name,
        pictureUrl: null,
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

  // ----- Entitlements -----

  async hasActiveSubscription(userId: number): Promise<boolean> {
    const row = db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          inArray(userSubscriptions.status, ["active", "trialing", "past_due"]),
        ),
      )
      .get();
    return !!row;
  }

  async getActiveSubscription(userId: number): Promise<UserSubscription | undefined> {
    return db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          inArray(userSubscriptions.status, ["active", "trialing", "past_due"]),
        ),
      )
      .orderBy(desc(userSubscriptions.id))
      .get();
  }

  async hasPurchasedPrayer(userId: number, uploadedPrayerId: number): Promise<boolean> {
    const row = db
      .select()
      .from(prayerPurchases)
      .where(
        and(
          eq(prayerPurchases.userId, userId),
          eq(prayerPurchases.uploadedPrayerId, uploadedPrayerId),
          eq(prayerPurchases.status, "paid"),
        ),
      )
      .get();
    return !!row;
  }

  async listUserPurchases(userId: number): Promise<PrayerPurchase[]> {
    return db
      .select()
      .from(prayerPurchases)
      .where(eq(prayerPurchases.userId, userId))
      .orderBy(desc(prayerPurchases.id))
      .all();
  }

  async recordPrayerPurchase(input: {
    userId: number;
    uploadedPrayerId: number;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    amountCents?: number;
    currency?: string;
  }): Promise<PrayerPurchase> {
    const existing = db
      .select()
      .from(prayerPurchases)
      .where(
        and(
          eq(prayerPurchases.userId, input.userId),
          eq(prayerPurchases.uploadedPrayerId, input.uploadedPrayerId),
        ),
      )
      .get();
    if (existing) {
      const updated = db
        .update(prayerPurchases)
        .set({
          status: "paid",
          stripeSessionId: input.stripeSessionId || existing.stripeSessionId,
          stripePaymentIntentId:
            input.stripePaymentIntentId || existing.stripePaymentIntentId,
          amountCents: input.amountCents ?? existing.amountCents,
          currency: input.currency || existing.currency,
        })
        .where(eq(prayerPurchases.id, existing.id))
        .returning()
        .get();
      return updated ?? existing;
    }
    return db
      .insert(prayerPurchases)
      .values({
        userId: input.userId,
        uploadedPrayerId: input.uploadedPrayerId,
        stripeSessionId: input.stripeSessionId ?? "",
        stripePaymentIntentId: input.stripePaymentIntentId ?? "",
        amountCents: input.amountCents ?? 700,
        currency: input.currency ?? "usd",
        status: "paid",
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async upsertSubscription(input: {
    userId: number;
    stripeCustomerId?: string;
    stripeSubscriptionId: string;
    status: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  }): Promise<UserSubscription> {
    const existing = db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, input.stripeSubscriptionId))
      .get();
    if (existing) {
      const updated = db
        .update(userSubscriptions)
        .set({
          userId: input.userId || existing.userId,
          stripeCustomerId: input.stripeCustomerId || existing.stripeCustomerId,
          status: input.status,
          currentPeriodEnd: input.currentPeriodEnd ?? existing.currentPeriodEnd,
          cancelAtPeriodEnd:
            input.cancelAtPeriodEnd != null
              ? input.cancelAtPeriodEnd
                ? 1
                : 0
              : existing.cancelAtPeriodEnd,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userSubscriptions.id, existing.id))
        .returning()
        .get();
      return updated ?? existing;
    }
    return db
      .insert(userSubscriptions)
      .values({
        userId: input.userId,
        stripeCustomerId: input.stripeCustomerId ?? "",
        stripeSubscriptionId: input.stripeSubscriptionId,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd ?? "",
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ? 1 : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  async setSubscriptionStatusByStripeId(
    stripeSubscriptionId: string,
    status: string,
    extra?: { currentPeriodEnd?: string; cancelAtPeriodEnd?: boolean },
  ): Promise<UserSubscription | undefined> {
    return db
      .update(userSubscriptions)
      .set({
        status,
        currentPeriodEnd:
          extra?.currentPeriodEnd ?? undefined,
        cancelAtPeriodEnd:
          extra?.cancelAtPeriodEnd != null
            ? extra.cancelAtPeriodEnd
              ? 1
              : 0
            : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning()
      .get();
  }
}

export const storage = new DatabaseStorage();
