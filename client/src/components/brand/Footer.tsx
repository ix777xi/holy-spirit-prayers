import { Link } from "wouter";
import { useState } from "react";
import { Mail, Instagram, Youtube, Facebook } from "lucide-react";
import { Logo } from "./Logo";
import { Scripture } from "./Scripture";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast({ title: "Please enter a valid email." });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/email/signup", { email, source: "footer" });
      toast({ title: "Thank you — you’re subscribed.", description: "Look out for weekly prayer encouragements." });
      setEmail("");
    } catch (err: any) {
      toast({ title: "Could not subscribe.", description: err?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="mt-24 bg-brand-navy text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <Scripture reference="Philippians 4:6–7" align="center" size="lg">
            <span className="text-white/95">
              Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving,
              let your requests be made known to God; and the peace of God, which surpasses all understanding,
              will guard your hearts and minds through Christ Jesus.
            </span>
          </Scripture>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4 space-y-4">
          <div className="text-white"><Logo size="md" subtitle /></div>
          <p className="text-sm text-white/70 max-w-sm">
            A digital sanctuary of Bible-rooted prayers — to listen, download, and personalize for every season of life.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <a href="#" aria-label="Instagram" className="p-2 rounded-md hover:bg-white/10"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="YouTube" className="p-2 rounded-md hover:bg-white/10"><Youtube className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="p-2 rounded-md hover:bg-white/10"><Facebook className="h-4 w-4" /></a>
            <a href="mailto:hello@holyspiritprayers.com" aria-label="Email" className="p-2 rounded-md hover:bg-white/10"><Mail className="h-4 w-4" /></a>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-3">Explore</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/library" className="hover:text-brand-gold">Library</Link></li>
            <li><Link href="/free-prayer" className="hover:text-brand-gold">Free prayer</Link></li>
            <li><Link href="/custom-prayer" className="hover:text-brand-gold">Custom prayer</Link></li>
            <li><Link href="/about" className="hover:text-brand-gold">About</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-3">Account</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-brand-gold">Log in</Link></li>
            <li><Link href="/register" className="hover:text-brand-gold">Sign up</Link></li>
            <li><Link href="/dashboard" className="hover:text-brand-gold">Dashboard</Link></li>
            <li><Link href="/contact" className="hover:text-brand-gold">Contact</Link></li>
            <li><Link href="/legal" className="hover:text-brand-gold">Legal</Link></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-3">Stay encouraged</div>
          <p className="text-sm text-white/70 mb-3">
            Weekly prayer reminders, new prayers, and Scripture in your inbox.
          </p>
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2" data-testid="form-newsletter-footer">
            <label htmlFor="footer-email" className="sr-only">Email</label>
            <input
              id="footer-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              data-testid="input-newsletter-email"
              className="flex-1 rounded-md bg-white/10 border border-white/15 px-3 py-2 text-sm placeholder:text-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
            />
            <button
              type="submit"
              disabled={submitting}
              data-testid="button-newsletter-submit"
              className="rounded-md bg-brand-gold text-brand-navy text-sm font-semibold px-4 py-2 hover:bg-brand-goldsoft transition-colors disabled:opacity-60"
            >
              {submitting ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between text-xs text-white/55">
          <div>© {new Date().getFullYear()} Holy Spirit Prayers. All rights reserved.</div>
          <div className="max-w-3xl">
            These prayers are faith-based spiritual resources and are not a substitute for medical, legal, financial, or professional counseling.
          </div>
        </div>
      </div>
    </footer>
  );
}
