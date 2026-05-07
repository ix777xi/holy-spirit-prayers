import type { Express, Request, Response } from "express";
import type { Server } from "node:http";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { storage, db } from "./storage";
import { uploadedPrayers } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { attachSessionMiddleware, registerAuthRoutes, requireAuth } from "./auth";
import {
  attachAdminSessionMiddleware,
  registerAdminAuthRoutes,
  requireAdmin,
} from "./admin-auth";

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

const MAX_UPLOAD_BYTES = 75 * 1024 * 1024; // 75MB (audio + optional PDF)

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

  attachSessionMiddleware(app);
  registerAuthRoutes(app);
  attachAdminSessionMiddleware(app);
  registerAdminAuthRoutes(app);

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

  // Public counts (used by health/dashboards if needed). Real prayer data is
  // served via /api/uploaded-prayers.
  app.get("/api/prayers", async (_req, res) => {
    try {
      const count = db.select().from(uploadedPrayers).all().length;
      res.json({ ok: true, source: "uploaded", count });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed" });
    }
  });

  // Admin dashboard summary
  app.get("/api/admin/dashboard", async (_req, res) => {
    try {
      const uploadedCount = db.select().from(uploadedPrayers).all().length;
      res.json({
        ok: true,
        uploadedPrayers: uploadedCount,
        newsletterSignups: memory.newsletter.length,
        contactSubmissions: memory.contact.length,
        customPrayerRequests: memory.customPrayers.length,
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed" });
    }
  });

  // ----- Uploaded prayers (admin upload + library listing) -----

  // List uploaded prayers (public metadata only — audio URLs are gated).
  // For each item we attach an `access` flag and only expose audio URLs to
  // users who can actually listen/download, so the SPA can render previews
  // or buy CTAs accordingly.
  app.get("/api/uploaded-prayers", async (req, res) => {
    try {
      const rows = db
        .select()
        .from(uploadedPrayers)
        .orderBy(desc(uploadedPrayers.id))
        .all();
      const userId = req.user?.id ?? null;
      const isAdmin = !!req.isAdmin;
      const subscribed = userId ? await storage.hasActiveSubscription(userId) : false;
      const purchasedSet = new Set<number>();
      if (userId) {
        for (const p of await storage.listUserPurchases(userId)) {
          if (p.status === "paid") purchasedSet.add(p.uploadedPrayerId);
        }
      }
      const items = rows.map((r) => {
        const purchased = purchasedSet.has(r.id);
        const isFree = !!r.isFree;
        const access =
          isAdmin || (!!userId && (isFree || subscribed || purchased));
        const hasPdf = !!r.pdfFilename;
        return {
          id: r.id,
          title: r.title,
          categorySlug: r.categorySlug,
          description: r.description,
          bibleTheme: r.bibleTheme,
          supportingScripture: r.supportingScripture,
          aboutPrayer: r.aboutPrayer,
          whatsIncluded: r.whatsIncluded,
          scriptureQuote: r.scriptureQuote,
          scriptureReference: r.scriptureReference,
          categoryDescription: r.categoryDescription,
          audioUrl: access ? `/api/uploaded-prayers/${r.id}/stream` : null,
          downloadUrl: access ? `/api/uploaded-prayers/${r.id}/download` : null,
          audioOriginalName: r.audioOriginalName,
          audioMimeType: r.audioMimeType,
          audioSize: r.audioSize,
          durationSeconds: r.durationSeconds,
          hasPdf,
          pdfOriginalName: r.pdfOriginalName,
          pdfMimeType: r.pdfMimeType,
          pdfSize: r.pdfSize,
          pdfDownloadUrl:
            hasPdf && access ? `/api/uploaded-prayers/${r.id}/pdf/download` : null,
          createdAt: r.createdAt,
          isFree,
          access,
          purchased,
          subscribed,
          priceCents: 700,
        };
      });
      res.json({ ok: true, items, subscribed, authenticated: !!userId });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Failed to list" });
    }
  });

  // Per-user access status for a single uploaded prayer
  app.get("/api/uploaded-prayers/:id/access", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
    const row = db.select().from(uploadedPrayers).where(eqId(id)).get();
    if (!row) return res.status(404).json({ ok: false, error: "Not found" });
    const isFree = !!row.isFree;
    const hasPdf = !!row.pdfFilename;
    const userId = req.user?.id ?? null;
    if (!userId) {
      return res.json({
        ok: true,
        authenticated: false,
        access: false,
        subscribed: false,
        purchased: false,
        isFree,
        hasPdf,
        pdfDownloadUrl: null,
        priceCents: 700,
      });
    }
    const subscribed = await storage.hasActiveSubscription(userId);
    const purchased = await storage.hasPurchasedPrayer(userId, id);
    const access = isFree || subscribed || purchased;
    res.json({
      ok: true,
      authenticated: true,
      access,
      subscribed,
      purchased,
      isFree,
      hasPdf,
      pdfDownloadUrl: hasPdf && access ? `/api/uploaded-prayers/${id}/pdf/download` : null,
      priceCents: 700,
    });
  });

  // Create uploaded prayer (multipart form-data: title, categorySlug, description, audio)
  app.post("/api/uploaded-prayers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ct = String(req.headers["content-type"] || "");
      const m = /boundary=([^;]+)/i.exec(ct);
      if (!m) return res.status(400).json({ ok: false, error: "multipart/form-data with boundary required" });
      const boundary = m[1].trim().replace(/^"|"$/g, "");

      const buf = await readBody(req);
      const parts = parseMultipart(buf, boundary);

      const fields: Record<string, string> = {};
      let file: ParsedFile | null = null;
      let pdfFile: ParsedFile | null = null;
      for (const p of parts) {
        if (p.type === "field") fields[p.name] = p.value;
        else if (p.type === "file" && p.name === "audio") file = p;
        else if (p.type === "file" && p.name === "pdf") pdfFile = p;
      }

      const meta = z
        .object({
          title: z.string().min(1).max(200),
          categorySlug: z.string().min(1).max(80),
          description: z.string().max(2000).optional().default(""),
          bibleTheme: z.string().max(2000).optional().default(""),
          supportingScripture: z.string().max(4000).optional().default(""),
          aboutPrayer: z.string().max(4000).optional().default(""),
          whatsIncluded: z.string().max(4000).optional().default(""),
          scriptureQuote: z.string().max(4000).optional().default(""),
          scriptureReference: z.string().max(200).optional().default(""),
          categoryDescription: z.string().max(2000).optional().default(""),
          isFree: z
            .union([z.literal("true"), z.literal("false"), z.literal("on"), z.literal("1"), z.literal("0"), z.literal("")])
            .optional()
            .default("false"),
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

      let pdfStored = "";
      let pdfOriginal = "";
      let pdfMime = "";
      let pdfSize = 0;
      if (pdfFile && pdfFile.data.length > 0) {
        const ct = pdfFile.contentType.toLowerCase();
        const isPdf =
          ct.includes("application/pdf") ||
          ct.includes("pdf") ||
          /\.pdf$/i.test(pdfFile.filename);
        if (!isPdf) {
          return res
            .status(400)
            .json({ ok: false, error: "PDF companion must be a PDF document" });
        }
        const safePdfOriginal = safeFilename(pdfFile.filename || "prayer.pdf");
        pdfStored = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safePdfOriginal}`;
        const pdfDest = path.join(UPLOAD_DIR, pdfStored);
        fs.writeFileSync(pdfDest, pdfFile.data);
        pdfOriginal = safePdfOriginal;
        pdfMime = pdfFile.contentType || "application/pdf";
        pdfSize = pdfFile.data.length;
      }

      const isFreeFlag = ["true", "on", "1"].includes(String(meta.data.isFree));
      const inserted = db
        .insert(uploadedPrayers)
        .values({
          title: meta.data.title,
          categorySlug: meta.data.categorySlug,
          description: meta.data.description ?? "",
          bibleTheme: meta.data.bibleTheme ?? "",
          supportingScripture: meta.data.supportingScripture ?? "",
          aboutPrayer: meta.data.aboutPrayer ?? "",
          whatsIncluded: meta.data.whatsIncluded ?? "",
          scriptureQuote: meta.data.scriptureQuote ?? "",
          scriptureReference: meta.data.scriptureReference ?? "",
          categoryDescription: meta.data.categoryDescription ?? "",
          audioFilename: stored,
          audioOriginalName: safeOriginal,
          audioMimeType: file.contentType || "audio/mpeg",
          audioSize: file.data.length,
          durationSeconds: 0,
          pdfFilename: pdfStored,
          pdfOriginalName: pdfOriginal,
          pdfMimeType: pdfMime,
          pdfSize,
          isFree: isFreeFlag ? 1 : 0,
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
          bibleTheme: inserted.bibleTheme,
          supportingScripture: inserted.supportingScripture,
          aboutPrayer: inserted.aboutPrayer,
          whatsIncluded: inserted.whatsIncluded,
          scriptureQuote: inserted.scriptureQuote,
          scriptureReference: inserted.scriptureReference,
          categoryDescription: inserted.categoryDescription,
          audioUrl: `/api/uploaded-prayers/${inserted.id}/stream`,
          downloadUrl: `/api/uploaded-prayers/${inserted.id}/download`,
          audioOriginalName: inserted.audioOriginalName,
          audioMimeType: inserted.audioMimeType,
          audioSize: inserted.audioSize,
          durationSeconds: inserted.durationSeconds,
          hasPdf: !!inserted.pdfFilename,
          pdfOriginalName: inserted.pdfOriginalName,
          pdfMimeType: inserted.pdfMimeType,
          pdfSize: inserted.pdfSize,
          pdfDownloadUrl: inserted.pdfFilename
            ? `/api/uploaded-prayers/${inserted.id}/pdf/download`
            : null,
          isFree: !!inserted.isFree,
          createdAt: inserted.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Upload failed" });
    }
  });

  // Delete an uploaded prayer (admin convenience)
  app.delete("/api/uploaded-prayers/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
      const row = db.select().from(uploadedPrayers).where(eqId(id)).get();
      if (!row) return res.status(404).json({ ok: false, error: "Not found" });
      const filePath = path.join(UPLOAD_DIR, row.audioFilename);
      try { fs.unlinkSync(filePath); } catch {}
      if (row.pdfFilename) {
        const pdfPath = path.join(UPLOAD_DIR, row.pdfFilename);
        try { fs.unlinkSync(pdfPath); } catch {}
      }
      db.delete(uploadedPrayers).where(eqId(id)).run();
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || "Delete failed" });
    }
  });

  // Protected audio stream — only logged-in users with entitlement may listen.
  // Admins (uploads page) get access for review. Supports HTTP Range so the
  // <audio> element can seek within the file.
  app.get("/api/uploaded-prayers/:id/stream", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
    const row = db.select().from(uploadedPrayers).where(eqId(id)).get();
    if (!row) return res.status(404).json({ ok: false, error: "Not found" });

    if (!req.isAdmin) {
      if (!req.user?.id) {
        return res.status(401).json({ ok: false, error: "Authentication required" });
      }
      const userId = req.user.id;
      const isFree = !!row.isFree;
      const subscribed = isFree ? false : await storage.hasActiveSubscription(userId);
      const purchased = isFree ? false : await storage.hasPurchasedPrayer(userId, id);
      if (!isFree && !subscribed && !purchased) {
        return res.status(402).json({
          ok: false,
          error: "Payment required",
          priceCents: 700,
        });
      }
    }

    const filePath = path.join(UPLOAD_DIR, row.audioFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: "Audio file missing" });
    }
    const stat = fs.statSync(filePath);
    const total = stat.size;
    const range = req.headers.range;
    res.setHeader("Content-Type", row.audioMimeType || "audio/mpeg");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, no-store");

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match && match[1] ? parseInt(match[1], 10) : 0;
      const end = match && match[2] ? parseInt(match[2], 10) : total - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start >= total) {
        res.setHeader("Content-Range", `bytes */${total}`);
        return res.status(416).end();
      }
      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
      res.setHeader("Content-Length", String(chunkSize));
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }
    res.setHeader("Content-Length", String(total));
    fs.createReadStream(filePath).pipe(res);
  });

  // Protected file download — same gate, but always served as an attachment.
  app.get("/api/uploaded-prayers/:id/download", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
    const row = db.select().from(uploadedPrayers).where(eqId(id)).get();
    if (!row) return res.status(404).json({ ok: false, error: "Not found" });

    if (!req.isAdmin) {
      if (!req.user?.id) {
        return res.status(401).json({ ok: false, error: "Authentication required" });
      }
      const userId = req.user.id;
      const isFree = !!row.isFree;
      const subscribed = isFree ? false : await storage.hasActiveSubscription(userId);
      const purchased = isFree ? false : await storage.hasPurchasedPrayer(userId, id);
      if (!isFree && !subscribed && !purchased) {
        return res.status(402).json({
          ok: false,
          error: "Payment required",
          priceCents: 700,
        });
      }
    }

    const filePath = path.join(UPLOAD_DIR, row.audioFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: "Audio file missing" });
    }
    const downloadName = row.audioOriginalName || `${row.title || "prayer"}.mp3`;
    res.setHeader("Content-Type", row.audioMimeType || "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadName.replace(/"/g, "")}"`,
    );
    res.setHeader("Cache-Control", "private, no-store");
    fs.createReadStream(filePath).pipe(res);
  });

  // Protected PDF companion download — same access gate as the audio.
  app.get("/api/uploaded-prayers/:id/pdf/download", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
    const row = db.select().from(uploadedPrayers).where(eqId(id)).get();
    if (!row) return res.status(404).json({ ok: false, error: "Not found" });
    if (!row.pdfFilename) {
      return res.status(404).json({ ok: false, error: "No PDF attached" });
    }

    if (!req.isAdmin) {
      if (!req.user?.id) {
        return res.status(401).json({ ok: false, error: "Authentication required" });
      }
      const userId = req.user.id;
      const isFree = !!row.isFree;
      const subscribed = isFree ? false : await storage.hasActiveSubscription(userId);
      const purchased = isFree ? false : await storage.hasPurchasedPrayer(userId, id);
      if (!isFree && !subscribed && !purchased) {
        return res.status(402).json({
          ok: false,
          error: "Payment required",
          priceCents: 700,
        });
      }
    }

    const pdfPath = path.join(UPLOAD_DIR, row.pdfFilename);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ ok: false, error: "PDF file missing" });
    }
    const downloadName = row.pdfOriginalName || `${row.title || "prayer"}.pdf`;
    res.setHeader("Content-Type", row.pdfMimeType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadName.replace(/"/g, "")}"`,
    );
    res.setHeader("Cache-Control", "private, no-store");
    fs.createReadStream(pdfPath).pipe(res);
  });

  // ----- User selected prayers -----

  const selectPrayerSchema = z.object({
    source: z.enum(["seed", "uploaded"]),
    prayerKey: z.string().min(1).max(200),
    title: z.string().min(1).max(300),
    categorySlug: z.string().max(120).optional().default(""),
    description: z.string().max(2000).optional().default(""),
    audioUrl: z.string().max(500).optional().default(""),
  });

  app.get("/api/me/prayers", requireAuth, async (req, res) => {
    const items = await storage.listUserPrayers(req.user!.id);
    res.json({ ok: true, items });
  });

  app.post("/api/me/prayers", requireAuth, async (req, res) => {
    const parsed = selectPrayerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid input", issues: parsed.error.issues });
    }
    const item = await storage.upsertUserPrayer({
      userId: req.user!.id,
      ...parsed.data,
    });
    res.json({ ok: true, item });
  });

  const updatePrayerSchema = z.object({
    rating: z.number().int().min(0).max(5).optional(),
    feedback: z.string().max(4000).optional(),
  });

  app.patch("/api/me/prayers/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
    const parsed = updatePrayerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid input", issues: parsed.error.issues });
    }
    const updated = await storage.updateUserPrayer(req.user!.id, id, parsed.data);
    if (!updated) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, item: updated });
  });

  app.post("/api/me/prayers/:id/download", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
    const updated = await storage.recordDownload(req.user!.id, id);
    if (!updated) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, item: updated });
  });

  app.delete("/api/me/prayers/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
    const ok = await storage.deleteUserPrayer(req.user!.id, id);
    if (!ok) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true });
  });

  // Stripe webhook. Uses the raw request body captured by `express.json`'s
  // `verify` callback (see server/index.ts) to verify the signature.
  // In production STRIPE_WEBHOOK_SECRET is required and missing/invalid
  // signatures fail closed. In dev, missing secret falls through with a
  // warning so the dashboard test button can still exercise the handler.
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      const sigHeader = (req.headers["stripe-signature"] || "").toString();
      const rawBuf = (req as any).rawBody as Buffer | undefined;
      const isProd = process.env.NODE_ENV === "production";

      if (!secret) {
        if (isProd) {
          console.error("[stripe] STRIPE_WEBHOOK_SECRET missing — rejecting webhook");
          return res.status(503).json({ ok: false, error: "Webhook not configured" });
        }
        console.warn("[stripe] STRIPE_WEBHOOK_SECRET missing — accepting unsigned event in dev");
      } else {
        if (!rawBuf) {
          return res.status(400).json({ ok: false, error: "Missing raw body for signature verification" });
        }
        if (!verifyStripeSignature(rawBuf, sigHeader, secret)) {
          return res.status(400).json({ ok: false, error: "Invalid signature" });
        }
      }

      const event = (req.body && typeof req.body === "object" ? req.body : {}) as {
        id?: string;
        type?: string;
        data?: { object?: Record<string, any> };
      };
      const type = event.type || "";
      const obj = event.data?.object || {};

      switch (type) {
        case "checkout.session.completed": {
          const mode = String(obj.mode || "");
          const metadata = (obj.metadata || {}) as Record<string, string>;
          const clientRef = obj.client_reference_id ? String(obj.client_reference_id) : "";
          const userIdNum = Number(metadata.userId || clientRef || 0);

          if (mode === "payment") {
            const uploadedPrayerId = Number(metadata.uploadedPrayerId || 0);
            if (Number.isFinite(userIdNum) && userIdNum > 0 && Number.isFinite(uploadedPrayerId) && uploadedPrayerId > 0) {
              await storage.recordPrayerPurchase({
                userId: userIdNum,
                uploadedPrayerId,
                stripeSessionId: String(obj.id || ""),
                stripePaymentIntentId: String(obj.payment_intent || ""),
                amountCents: Number(obj.amount_total || 700),
                currency: String(obj.currency || "usd"),
              });
            }
          } else if (mode === "subscription") {
            const stripeSubId = String(obj.subscription || "");
            if (Number.isFinite(userIdNum) && userIdNum > 0 && stripeSubId) {
              await storage.upsertSubscription({
                userId: userIdNum,
                stripeCustomerId: String(obj.customer || ""),
                stripeSubscriptionId: stripeSubId,
                status: "active",
              });
            }
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.created": {
          const stripeSubId = String(obj.id || "");
          const status = String(obj.status || "active");
          const cpeRaw = Number(obj.current_period_end || 0);
          const cpe = cpeRaw ? new Date(cpeRaw * 1000).toISOString() : "";
          const cancelAtPeriodEnd = !!obj.cancel_at_period_end;
          if (stripeSubId) {
            const updated = await storage.setSubscriptionStatusByStripeId(
              stripeSubId,
              status,
              { currentPeriodEnd: cpe, cancelAtPeriodEnd },
            );
            if (!updated) {
              const metadata = (obj.metadata || {}) as Record<string, string>;
              const userIdNum = Number(metadata.userId || 0);
              if (Number.isFinite(userIdNum) && userIdNum > 0) {
                await storage.upsertSubscription({
                  userId: userIdNum,
                  stripeCustomerId: String(obj.customer || ""),
                  stripeSubscriptionId: stripeSubId,
                  status,
                  currentPeriodEnd: cpe,
                  cancelAtPeriodEnd,
                });
              }
            }
          }
          break;
        }
        case "customer.subscription.deleted": {
          const stripeSubId = String(obj.id || "");
          if (stripeSubId) {
            await storage.setSubscriptionStatusByStripeId(stripeSubId, "canceled");
          }
          break;
        }
        default:
          break;
      }

      res.json({ received: true, type });
    } catch (err: any) {
      console.error("[stripe] webhook handler error", err);
      res.status(500).json({ ok: false, error: err?.message || "Webhook error" });
    }
  });

  // One-time Stripe Checkout for purchasing a single uploaded prayer ($7).
  app.post(
    "/api/uploaded-prayers/:id/create-checkout-session",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Invalid id" });
        const row = db.select().from(uploadedPrayers).where(eqId(id)).get();
        if (!row) return res.status(404).json({ ok: false, error: "Not found" });

        const secret = process.env.STRIPE_SECRET_KEY;
        if (!secret) {
          return res.status(503).json({
            ok: false,
            error: "Stripe is not configured. Set STRIPE_SECRET_KEY in the server environment.",
          });
        }

        const userId = req.user!.id;
        const baseUrl = resolveBaseUrl(req);
        const successUrl = `${baseUrl}/#/account?purchase=success&prayer=${id}&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/#/library?purchase=cancelled`;

        const params = new URLSearchParams();
        params.append("mode", "payment");
        params.append("success_url", successUrl);
        params.append("cancel_url", cancelUrl);
        params.append("allow_promotion_codes", "true");
        params.append("client_reference_id", String(userId));
        params.append("metadata[userId]", String(userId));
        params.append("metadata[uploadedPrayerId]", String(id));

        const priceId = process.env.STRIPE_PRAYER_PRICE_ID;
        if (priceId) {
          params.append("line_items[0][price]", priceId);
          params.append("line_items[0][quantity]", "1");
        } else {
          params.append("line_items[0][quantity]", "1");
          params.append("line_items[0][price_data][currency]", "usd");
          params.append("line_items[0][price_data][unit_amount]", "700");
          params.append(
            "line_items[0][price_data][product_data][name]",
            `Holy Spirit Prayer — ${row.title}`,
          );
          if (row.description) {
            params.append(
              "line_items[0][price_data][product_data][description]",
              row.description.slice(0, 500),
            );
          }
        }

        const userEmail = req.user?.email;
        if (userEmail) params.append("customer_email", userEmail);

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
        res.status(500).json({ ok: false, error: err?.message || "Prayer checkout failed" });
      }
    },
  );

  // Account: list one-time prayer purchases for the signed-in user
  app.get("/api/me/purchases", requireAuth, async (req, res) => {
    const items = await storage.listUserPurchases(req.user!.id);
    const subscription = await storage.getActiveSubscription(req.user!.id);
    res.json({
      ok: true,
      items,
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd || null,
            cancelAtPeriodEnd: !!subscription.cancelAtPeriodEnd,
          }
        : null,
    });
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

      // Tie the subscription to the logged-in user so the webhook can mark
      // the user's account as active.
      if (req.user?.id) {
        params.append("client_reference_id", String(req.user.id));
        params.append("metadata[userId]", String(req.user.id));
        params.append("subscription_data[metadata][userId]", String(req.user.id));
        if (req.user.email) params.append("customer_email", req.user.email);
      }

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

// Stripe webhook signatures look like `t=12345,v1=hex,v1=hex,...`. We verify
// each `v1` candidate against HMAC-SHA256(`${t}.${rawBody}`, secret). 5-minute
// tolerance window matches Stripe's reference implementation.
function verifyStripeSignature(
  rawBody: Buffer,
  header: string,
  secret: string,
): boolean {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim());
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "t") timestamp = v;
    else if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return false;
  const ageSec = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSec) || ageSec > 5 * 60) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  for (const sig of signatures) {
    let sigBuf: Buffer;
    try {
      sigBuf = Buffer.from(sig, "hex");
    } catch {
      continue;
    }
    if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}
