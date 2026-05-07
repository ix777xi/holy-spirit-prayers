import type { Express, Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const SESSION_COOKIE = "hsp_sid";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

type Session = {
  userId: number;
  createdAt: number;
};

const sessions = new Map<string, Session>();

function newToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function setCookie(
  res: Response,
  name: string,
  value: string,
  opts: { maxAgeMs?: number; httpOnly?: boolean; sameSite?: "Lax" | "Strict" | "None"; path?: string; secure?: boolean } = {},
) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path ?? "/"}`);
  if (opts.maxAgeMs != null) parts.push(`Max-Age=${Math.floor(opts.maxAgeMs / 1000)}`);
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  parts.push(`SameSite=${opts.sameSite ?? "Lax"}`);
  if (opts.secure) parts.push("Secure");
  const prev = res.getHeader("Set-Cookie");
  const next = parts.join("; ");
  if (Array.isArray(prev)) res.setHeader("Set-Cookie", [...prev, next]);
  else if (typeof prev === "string") res.setHeader("Set-Cookie", [prev, next]);
  else res.setHeader("Set-Cookie", next);
}

function clearCookie(res: Response, name: string) {
  setCookie(res, name, "", { maxAgeMs: 0 });
}

function isHttps(req: Request): boolean {
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "").toString().split(",")[0].trim();
  return proto === "https";
}

const SCRYPT_KEYLEN = 64;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function issueSession(res: Response, req: Request, userId: number) {
  const sid = newToken();
  sessions.set(sid, { userId, createdAt: Date.now() });
  setCookie(res, SESSION_COOKIE, sid, {
    maxAgeMs: SESSION_TTL_MS,
    httpOnly: true,
    sameSite: "Lax",
    secure: isHttps(req),
  });
}

function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    pictureUrl: u.pictureUrl,
    username: u.username,
  };
}

declare module "express-serve-static-core" {
  interface Request {
    user?: User | null;
    sessionId?: string | null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }
  next();
}

export function attachSessionMiddleware(app: Express) {
  app.use(async (req, _res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (token) {
      const sess = sessions.get(token);
      if (sess && Date.now() - sess.createdAt < SESSION_TTL_MS) {
        const user = await storage.getUser(sess.userId);
        req.user = user ?? null;
        req.sessionId = token;
      } else if (sess) {
        sessions.delete(token);
      }
    }
    next();
  });
}

const registerSchema = z.object({
  name: z.string().min(1).max(120).optional().default(""),
  email: z.string().email().max(254),
  password: z.string().min(6).max(200),
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

export function registerAuthRoutes(app: Express) {
  // Current user
  app.get("/api/auth/me", (req, res) => {
    if (!req.user) return res.status(200).json({ ok: true, user: null });
    res.json({ ok: true, user: publicUser(req.user) });
  });

  // Register a new account
  app.post("/api/auth/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid email and a password of at least 6 characters.",
      });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const name = parsed.data.name.trim();

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res
        .status(409)
        .json({ ok: false, error: "An account with that email already exists." });
    }

    const passwordHash = hashPassword(parsed.data.password);
    const user = await storage.createLocalUser({
      email,
      name: name || email.split("@")[0],
      passwordHash,
    });

    issueSession(res, req, user.id);
    res.json({ ok: true, user: publicUser(user) });
  });

  // Log in with email + password
  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Email and password are required." });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const user = await storage.getUserByEmail(email);
    if (!user || !verifyPassword(parsed.data.password, user.password)) {
      return res
        .status(401)
        .json({ ok: false, error: "Email or password is incorrect." });
    }

    issueSession(res, req, user.id);
    res.json({ ok: true, user: publicUser(user) });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    if (req.sessionId) sessions.delete(req.sessionId);
    clearCookie(res, SESSION_COOKIE);
    res.json({ ok: true });
  });
}
