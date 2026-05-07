import type { Express, Request, Response } from "express";
import express from "express";
import type { Server } from "node:http";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { storage, db } from "./storage";
import { uploadedPrayers } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

/* ----- Validation schemas ----- */

const newsletterSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(1),
});

const customPrayerSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  recipientName: z.string().optional(),
  occasion: z.string().optional(),
  theme: z.string().optional(),
  scriptureRequest: z.string().optional(),
  notes: z.string().optional(),
  delivery: z.enum(["audio", "text", "both"]).optional(),
});

/* ----- Lightweight in-memory submission store (resets on restart) ----- */

const memory = {
  newsletter: [] as { email: string; source?: string; at: string }[],
  contact: [] as { name: string; email: string; subject?: string; message: string; at: string }[],
  customPrayers: [] as Array<z.infer<typeof customPrayerSchema> & { id: string; status: string; at: string }>,
};

let customPrayerCount = 0;

/* ----- Upload handling (no multer dependency) ----- */

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

type ParsedField = { type: "field"; name: string; value: string };
type ParsedFile = {
  type: "file";
  name: string;
  filename: string;
  contentType: string;
  data: Buffer;
};
type ParsedPart = ParsedField | ParsedFile;

async function readBody(req: Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_UPLOAD_BYTES) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipart(buf: Buffer, boundary: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const delimiter = Buffer.from(`--${boundary}`);
  const closing = Buffer.from(`--${boundary}--`);

  let offset = 0;
  // Skip preamble
  const firstIdx = buf.indexOf(delimiter, offset);
  if (firstIdx === -1) return parts;
  offset = firstIdx + delimiter.length;

  while (offset < buf.length) {
    // Skip CRLF after delimiter
    if (buf[offset] === 0x0d && buf[offset + 1] === 0x0a) offset += 2;
    // Find next delimiter
    const nextIdx = buf.indexOf(delimiter, offset);
    if (nextIdx === -1) break;
    // Section content is buf[offset..nextIdx-2] (trim trailing CRLF)
    let endContent = nextIdx;
    if (buf[endContent - 2] === 0x0d && buf[endContent - 1] === 0x0a) endContent -= 2;
    const section = buf.subarray(offset, endContent);

    // Parse headers / body
    const headerEnd = section.indexOf("\r\n\r\n");
    if (headerEnd !== -1) {
      const headerStr = section.subarray(0, headerEnd).toString("utf8");
      const body = section.subarray(headerEnd + 4);
      const dispMatch = /content-disposition:\s*form-data;([^\r\n]+)/i.exec(headerStr);
      const ctMatch = /content-type:\s*([^\r\n]+)/i.exec(headerStr);
      if (dispMatch) {
        const disp = dispMatch[1];
        const nameMatch = /name="([^"]*)"/.exec(disp);
        const filenameMatch = /filename="([^"]*)"/.exec(disp);
        if (filenameMatch && nameMatch) {
          parts.push({
            type: "file",
            name: nameMatch[1],
            filename: filenameMatch[1],
            contentType: (ctMatch?.[1] || "application/octet-stream").trim(),
            data: body,
          });
        } else if (nameMatch) {
          parts.push({
            type: "field",
            name: nameMatch[1],
            value: body.toString("utf8"),
          });
        }
      }
    }

    // Check if this was the closing boundary
    const isClosing = buf.subarray(nextIdx, nextIdx + closing.length).equals(closing);
    offset = nextIdx + delimiter.length;
    if (isClosing) break;
  }
  return parts;
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
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

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  ensureUploadDir();

  // Health
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "holy-spirit-prayers", time: new Date().toISOString() });
  });

  // Newsletter signup
  app.post("/api/email/signup", async (req, res) => {
    const parsed = newsletterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid email", issues: parsed.error.issues });
    }
    const entry = { ...parsed.data, at: new Date().toISOString() };
    memory.newsletter.push(entry);
    res.json({ ok: true, message: "Subscribed. Check your inbox for a confirmation." });
  });

  // Contact form
  app.post("/api/contact", async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    }
    const entry = { ...parsed.data, at: new Date().toISOString() };
    memory.contact.push(entry);
    res.json({ ok: true, message: "Thanks — we'll respond within 1–2 business days." });
  });

  // Custom prayer order intake
  app.post("/api/custom-prayers", async (req, res) => {
    const parsed = customPrayerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    }
    customPrayerCount += 1;
    const id = `CR-${String(2000 + customPrayerCount).padStart(4, "0")}`;
    const entry = {
      ...parsed.data,
      id,
      status: "pending",
      at: new Date().toISOString(),
    };
    memory.customPrayers.push(entry);
    res.json({
      ok: true,
      id,
      status: entry.status,
      message: "Custom prayer request received. Expected delivery: 24–48 hours.",
      checkoutUrl: null, // populate when Stripe is wired
    });
  });

  // Free prayer email gate
  app.post("/api/free-prayer/unlock", async (req, res) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid email" });
    memory.newsletter.push({ email: parsed.data.email, source: "free-prayer", at: new Date().toISOString() });
    res.json({ ok: true, message: "Enjoy your free prayer." });
  });

  // Stub: list prayers (frontend uses local seed; this endpoint is for parity)
  app.get("/api/prayers", async (_req, res) => {
    res.json({ ok: true, source: "seed", count: 18 });
  });

  app.get("/api/categories", async (_req, res) => {
    res.json({ ok: true, source: "seed", count: 24 });
  });

  // Admin dashboard summary stub
  app.get("/api/admin/dashboard", async (_req, res) => {
    res.json({
      ok: true,
      newsletterSignups: memory.newsletter.length,
      contactSubmissions: memory.contact.length,
      customPrayerRequests: memory.customPrayers.length,
    });
  });

  // ----- Uploaded prayers (admin upload + library listing) -----

  // List uploaded prayers
  app.get("/api/uploaded-prayers", async (_req, res) => {
    try {
      const rows = db
        .select()
        .from(uploadedPrayers)
        .orderBy(desc(uploadedPrayers.id))
        .all();
      const items = rows.map((r) => ({
        id: r.id,
        title: r.title,
        categorySlug: r.categorySlug,
        description: r.description,
        audioUrl: `/uploads/${r.audioFilename}`,
        audioOriginalName: r.audioOriginalName,
        audioMimeType: r.audioMimeType,
        audioSize: r.audioSize,
        durationSeconds: r.durationSeconds,
        createdAt: r.createdAt,
      }));
      res.json({ ok: true, items });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to list" });
    }
  });

  // Create uploaded prayer (multipart form-data: title, categorySlug, description, audio)
  app.post("/api/uploaded-prayers", async (req: Request, res: Response) => {
    try {
      const ct = String(req.headers["content-type"] || "");
      const m = /boundary=([^;]+)/i.exec(ct);
      if (!m) return res.status(400).json({ ok: false, error: "multipart/form-data with boundary required" });
      const boundary = m[1].trim().replace(/^"|"$/g, "");

      const buf = await readBody(req);
      const parts = parseMultipart(buf, boundary);

      const fields: Record<string, string> = {};
      let file: ParsedFile | null = null;
      for (const p of parts) {
        if (p.type === "field") fields[p.name] = p.value;
        else if (p.type === "file" && p.name === "audio") file = p;
      }

      const meta = z
        .object({
          title: z.string().min(1).max(200),
          categorySlug: z.string().min(1).max(80),
          description: z.string().max(2000).optional().default(""),
        })
        .safeParse(fields);

      if (!meta.success) {
        return res.status(400).json({ ok: false, error: "Invalid metadata", issues: meta.error.issues });
      }
      if (!file || file.data.length === 0) {
        return res.status(400).json({ ok: false, error: "Audio file is required" });
      }
      const isMp3 =
        file.contentType.toLowerCase().includes("mpeg") ||
        file.contentType.toLowerCase().includes("mp3") ||
        /\.mp3$/i.test(file.filename);
      if (!isMp3) {
        return res.status(400).json({ ok: false, error: "Only MP3 audio files are accepted" });
      }

      const safeOriginal = safeFilename(file.filename || "audio.mp3");
      const stored = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeOriginal}`;
      const dest = path.join(UPLOAD_DIR, stored);
      fs.writeFileSync(dest, file.data);

      const inserted = db
        .insert(uploadedPrayers)
        .values({
          title: meta.data.title,
          categorySlug: meta.data.categorySlug,
          description: meta.data.description ?? "",
          audioFilename: stored,
          audioOriginalName: safeOriginal,
          audioMimeType: file.contentType || "audio/mpeg",
          audioSize: file.data.length,
          durationSeconds: 0,
          createdAt: new Date().toISOString(),
        })
        .returning()
        .get();

      res.json({
        ok: true,
        item: {
          id: inserted.id,
          title: inserted.title,
          categorySlug: inserted.categorySlug,
          description: inserted.description,
          audioUrl: `/uploads/${inserted.audioFilename}`,
          audioOriginalName: inserted.audioOriginalName,
          audioMimeType: inserted.audioMimeType,
          audioSize: inserted.audioSize,
          durationSeconds: inserted.durationSeconds,
          createdAt: inserted.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Upload failed" });
    }
  });

  // Delete an uploaded prayer (admin convenience)
  app.delete("/api/uploaded-prayers/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
      const row = db.select().from(uploadedPrayers).where(eqId(id)).get();
      if (!row) return res.status(404).json({ ok: false, error: "Not found" });
      const filePath = path.join(UPLOAD_DIR, row.audioFilename);
      try { fs.unlinkSync(filePath); } catch {}
      db.delete(uploadedPrayers).where(eqId(id)).run();
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Delete failed" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1d", fallthrough: true }));

  // Stripe webhook placeholder (no signature verification stub)
  app.post("/api/stripe/webhook", async (_req, res) => {
    // TODO: verify with STRIPE_WEBHOOK_SECRET, then dispatch on event.type
    res.json({ received: true, stub: true });
  });

  // Stripe subscription checkout — $27/month
  app.post("/api/create-subscription-checkout-session", async (req: Request, res: Response) => {
    try {
      const secret = process.env.STRIPE_SECRET_KEY;
      if (!secret) {
        return res.status(503).json({
          ok: false,
          error:
            "Stripe is not configured. Set STRIPE_SECRET_KEY in the server environment.",
        });
      }

      const baseUrl = resolveBaseUrl(req);
      const successUrl = `${baseUrl}/#/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/#/?subscription=cancelled`;

      const params = new URLSearchParams();
      params.append("mode", "subscription");
      params.append("success_url", successUrl);
      params.append("cancel_url", cancelUrl);
      params.append("allow_promotion_codes", "true");
      params.append("billing_address_collection", "auto");

      const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
      if (priceId) {
        params.append("line_items[0][price]", priceId);
        params.append("line_items[0][quantity]", "1");
      } else {
        params.append("line_items[0][quantity]", "1");
        params.append(
          "line_items[0][price_data][product_data][name]",
          "Holy Spirit Prayers Monthly Subscription",
        );
        params.append("line_items[0][price_data][currency]", "usd");
        params.append("line_items[0][price_data][unit_amount]", "2700");
        params.append("line_items[0][price_data][recurring][interval]", "month");
      }

      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const session = (await stripeRes.json()) as {
        id?: string;
        url?: string;
        error?: { message?: string };
      };

      if (!stripeRes.ok || !session.url) {
        return res.status(stripeRes.status || 500).json({
          ok: false,
          error: session.error?.message || "Stripe checkout session failed",
        });
      }

      res.json({ ok: true, id: session.id, url: session.url });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Subscription checkout failed" });
    }
  });

  return httpServer;
}

// Avoid unused-import linter complaints
void storage;

function eqId(id: number) {
  return eq(uploadedPrayers.id, id);
}
