import type { Express, Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { z } from "zod";

const ADMIN_SESSION_COOKIE = "hsp_admin_sid";
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const DEFAULT_ADMIN_USERNAME = "Caleb";
const DEFAULT_ADMIN_PASSWORD = "HeartNoah";

type AdminSession = { createdAt: number };

const adminSessions = new Map<string, AdminSession>();

function getAdminCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
  };
}

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
  opts: {
    maxAgeMs?: number;
    httpOnly?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
    path?: string;
    secure?: boolean;
  } = {},
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
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "")
    .toString()
    .split(",")[0]
    .trim();
  return proto === "https";
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) {
    // Still run a comparison to avoid early-exit timing leaks
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

declare module "express-serve-static-core" {
  interface Request {
    isAdmin?: boolean;
    adminSessionId?: string | null;
  }
}

export function attachAdminSessionMiddleware(app: Express) {
  app.use((req, _res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[ADMIN_SESSION_COOKIE];
    if (token) {
      const sess = adminSessions.get(token);
      if (sess && Date.now() - sess.createdAt < ADMIN_SESSION_TTL_MS) {
        req.isAdmin = true;
        req.adminSessionId = token;
      } else if (sess) {
        adminSessions.delete(token);
      }
    }
    next();
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAdmin) {
    return res.status(401).json({ ok: false, error: "Admin authentication required" });
  }
  next();
}

const adminLoginSchema = z.object({
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(200),
});

export function registerAdminAuthRoutes(app: Express) {
  app.get("/api/admin/auth/me", (req, res) => {
    if (!req.isAdmin) return res.status(200).json({ ok: true, admin: null });
    const { username } = getAdminCredentials();
    res.json({ ok: true, admin: { username } });
  });

  app.post("/api/admin/auth/login", (req, res) => {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ ok: false, error: "Username and password are required." });
    }
    const { username, password } = getAdminCredentials();
    const usernameOk = timingSafeStringEqual(parsed.data.username, username);
    const passwordOk = timingSafeStringEqual(parsed.data.password, password);
    if (!usernameOk || !passwordOk) {
      return res
        .status(401)
        .json({ ok: false, error: "Username or password is incorrect." });
    }

    const sid = newToken();
    adminSessions.set(sid, { createdAt: Date.now() });
    setCookie(res, ADMIN_SESSION_COOKIE, sid, {
      maxAgeMs: ADMIN_SESSION_TTL_MS,
      httpOnly: true,
      sameSite: "Lax",
      secure: isHttps(req),
    });
    res.json({ ok: true, admin: { username } });
  });

  app.post("/api/admin/auth/logout", (req, res) => {
    if (req.adminSessionId) adminSessions.delete(req.adminSessionId);
    clearCookie(res, ADMIN_SESSION_COOKIE);
    res.json({ ok: true });
  });
}
