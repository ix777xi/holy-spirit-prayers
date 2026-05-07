import type { Express, Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const SESSION_COOKIE = "hsp_sid";
const OAUTH_STATE_COOKIE = "hsp_oauth_state";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

type Session = {
  userId: number;
  createdAt: number;
};

// In-memory session store. Sessions reset on restart — fine for prototype.
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
  // Append (don't replace) so multiple Set-Cookie headers can stack.
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

function resolveBaseUrl(req: Request): string {
  const envBase = (process.env.BASE_URL || "").replace(/\/+$/, "");
  if (envBase) return envBase;
  const origin = (req.headers.origin || "").toString().replace(/\/+$/, "");
  if (origin && /^https?:\/\//i.test(origin)) return origin;
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http").toString().split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").toString().split(",")[0].trim();
  if (host) return `${proto}://${host}`;
  return "http://localhost:5000";
}

function googleRedirectUri(req: Request): string {
  const explicit = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (explicit) return explicit;
  return `${resolveBaseUrl(req)}/api/auth/google/callback`;
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

export function registerAuthRoutes(app: Express) {
  // Current user
  app.get("/api/auth/me", (req, res) => {
    if (!req.user) return res.status(200).json({ ok: true, user: null });
    const u = req.user;
    res.json({
      ok: true,
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        pictureUrl: u.pictureUrl,
        username: u.username,
      },
    });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    if (req.sessionId) sessions.delete(req.sessionId);
    clearCookie(res, SESSION_COOKIE);
    res.json({ ok: true });
  });

  // Google OAuth — start
  app.get("/api/auth/google/start", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({
        ok: false,
        error:
          "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server environment.",
      });
    }
    const state = newToken();
    setCookie(res, OAUTH_STATE_COOKIE, state, {
      maxAgeMs: 1000 * 60 * 10,
      httpOnly: true,
      sameSite: "Lax",
      secure: isHttps(req),
    });
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: googleRedirectUri(req),
      scope: "openid email profile",
      access_type: "online",
      include_granted_scopes: "true",
      prompt: "select_account",
      state,
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  // Google OAuth — callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.status(503).send("Google OAuth is not configured.");
      }

      const code = (req.query.code as string | undefined) || "";
      const stateParam = (req.query.state as string | undefined) || "";
      const cookies = parseCookies(req.headers.cookie);
      const stateCookie = cookies[OAUTH_STATE_COOKIE];
      clearCookie(res, OAUTH_STATE_COOKIE);

      if (!code || !stateParam || !stateCookie || stateParam !== stateCookie) {
        return res.status(400).send("Invalid OAuth state");
      }

      const tokenParams = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: googleRedirectUri(req),
        grant_type: "authorization_code",
      });

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });
      const tokenJson = (await tokenRes.json()) as {
        access_token?: string;
        id_token?: string;
        error?: string;
        error_description?: string;
      };
      if (!tokenRes.ok || !tokenJson.access_token) {
        return res
          .status(502)
          .send(`Google token exchange failed: ${tokenJson.error_description || tokenJson.error || "unknown"}`);
      }

      const profileRes = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        { headers: { Authorization: `Bearer ${tokenJson.access_token}` } },
      );
      const profile = (await profileRes.json()) as {
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
      };
      if (!profile.sub || !profile.email) {
        return res.status(502).send("Google profile fetch failed");
      }

      const user = await storage.upsertGoogleUser({
        googleId: profile.sub,
        email: profile.email,
        name: profile.name || profile.email,
        pictureUrl: profile.picture,
      });

      const sid = newToken();
      sessions.set(sid, { userId: user.id, createdAt: Date.now() });
      setCookie(res, SESSION_COOKIE, sid, {
        maxAgeMs: SESSION_TTL_MS,
        httpOnly: true,
        sameSite: "Lax",
        secure: isHttps(req),
      });

      const baseUrl = resolveBaseUrl(req);
      res.redirect(`${baseUrl}/#/account?login=success`);
    } catch (err: any) {
      res.status(500).send(`OAuth callback error: ${err?.message || "unknown"}`);
    }
  });
}
