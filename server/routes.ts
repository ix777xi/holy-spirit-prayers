import type { Express } from "express";
import type { Server } from "node:http";
import { z } from "zod";
import { storage } from "./storage";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
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

  // Stripe webhook placeholder (no signature verification stub)
  app.post("/api/stripe/webhook", async (_req, res) => {
    // TODO: verify with STRIPE_WEBHOOK_SECRET, then dispatch on event.type
    res.json({ received: true, stub: true });
  });

  return httpServer;
}

// Avoid unused-import linter complaints
void storage;
