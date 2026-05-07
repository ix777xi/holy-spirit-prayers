import { useState } from "react";
import { Link } from "wouter";
import { Headphones, Download, Heart, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { PrayerCard } from "@/components/brand/PrayerCard";
import { Button } from "@/components/ui/button";
import { categories, prayers } from "@/lib/data";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const HERO_CATEGORY_SLUGS = [
  "protection",
  "healing",
  "anxiety-peace",
  "marriage",
  "family",
  "wisdom-direction",
  "morning",
  "purpose-calling",
];

const SHORT_NAME: Record<string, string> = {
  "anxiety-peace": "Anxiety & Peace",
  "wisdom-direction": "Wisdom & Direction",
  "purpose-calling": "Purpose & Calling",
};

function shortName(slug: string, fallback: string) {
  if (SHORT_NAME[slug]) return SHORT_NAME[slug];
  return fallback.replace(/\s*Prayers?$/i, "").replace(/^Prayers?\s+for\s+/i, "");
}

export default function HomePage() {
  const featured = prayers.filter((p) => p.isFeatured).slice(0, 6);
  const heroCategories = HERO_CATEGORY_SLUGS
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is (typeof categories)[number] => Boolean(c));

  return (
    <PageShell>
      {/* HERO — deep navy gradient with cream/gold accents */}
      <section
        className="surface-hero-navy relative overflow-hidden"
        data-testid="section-hero"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent"
        />
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-brand-gold/90 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Holy Spirit Prayers</span>
            <Sparkles className="h-3.5 w-3.5" />
          </div>

          <h1
            className="font-serif font-semibold tracking-tight text-4xl md:text-6xl leading-[1.05] text-brand-cream"
            style={{ fontFamily: "var(--font-display)" }}
            data-testid="text-hero-title"
          >
            Spirit-led prayers,<br className="hidden md:block" />{" "}
            <span className="text-brand-gold">rooted in Scripture.</span>
          </h1>

          <hr className="gold-divider" />

          <blockquote
            className="font-serif italic text-lg md:text-2xl text-brand-cream/90 max-w-3xl mx-auto leading-relaxed"
            style={{ fontFamily: "var(--font-display)" }}
            data-testid="text-hero-scripture"
          >
            “Likewise the Spirit also helps in our weaknesses. For we do not know what we should pray for as we ought,
            but the Spirit Himself makes intercession for us.”
          </blockquote>
          <div className="mt-3 text-xs uppercase tracking-[0.28em] text-brand-gold font-sans font-medium">
            Romans 8:26
          </div>

          <p className="mt-8 text-sm md:text-base text-brand-cream/75 max-w-2xl mx-auto font-sans">
            Bible-rooted prayers for every season — listen, download, request your own,
            or join thousands receiving daily Spirit-led prayer.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link href="/free-prayer">
              <Button
                size="lg"
                data-testid="button-cta-free"
                className="bg-brand-cream text-brand-navy hover:bg-white font-sans font-semibold rounded-full px-7 h-12 shadow-md border border-brand-gold/40 hover:border-brand-gold transition-all"
              >
                <Headphones className="h-4 w-4 mr-2" />
                Listen to a Free Prayer
              </Button>
            </Link>
            <Link href="/library">
              <Button
                size="lg"
                data-testid="button-cta-library"
                className="bg-brand-gold text-brand-navy hover:bg-brand-goldsoft font-sans font-semibold rounded-full px-7 h-12 shadow-md border border-brand-gold hover:border-brand-goldsoft transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                Browse Prayer Library
              </Button>
            </Link>
            <Link href="/custom-prayer">
              <Button
                size="lg"
                variant="outline"
                data-testid="button-cta-custom"
                className="bg-transparent border border-brand-cream/50 text-brand-cream hover:bg-brand-cream/10 hover:border-brand-cream font-sans font-semibold rounded-full px-7 h-12 shadow-md transition-all"
              >
                <Heart className="h-4 w-4 mr-2" />
                Request Custom Prayer
              </Button>
            </Link>
          </div>

          {/* Subscription CTA — $27/month */}
          <div className="mt-8">
            <SubscribeCta />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {heroCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/library?category=${c.slug}`}
                data-testid={`hero-chip-${c.slug}`}
                className="text-xs md:text-sm font-sans font-medium px-3 py-1.5 rounded-full border border-brand-gold/40 text-brand-cream/85 hover:bg-brand-gold/15 hover:border-brand-gold hover:text-brand-cream transition-colors"
              >
                {shortName(c.slug, c.name)}
              </Link>
            ))}
            <Link
              href="/library"
              data-testid="hero-chip-all"
              className="text-xs md:text-sm font-sans font-medium px-3 py-1.5 rounded-full border border-brand-gold bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-brand-navy"
            >
              All categories →
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 3 icon cards */}
      <section
        className="mx-auto max-w-6xl px-6 py-24 md:py-28"
        data-testid="section-how-it-works"
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-[11px] uppercase tracking-[0.32em] text-brand-gold mb-3 font-sans font-medium">
            How it works
          </div>
          <h2
            className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            A sanctuary, in three simple steps
          </h2>
          <hr className="gold-divider-thin" />
          <p className="text-sm md:text-base text-muted-foreground mt-3 font-sans">
            Pick the path that fits your moment of prayer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <HowCard
            testId="howitworks-card-listen"
            href="/free-prayer"
            icon={<Headphones className="h-6 w-6" />}
            kicker="Step 1"
            title="Listen"
            body="Open a free, Spirit-led prayer narrated with calm intention — perfect for morning, night, or any quiet moment."
            cta="Hear today's prayer"
          />
          <HowCard
            testId="howitworks-card-download"
            href="/library"
            icon={<Download className="h-6 w-6" />}
            kicker="Step 2"
            title="Download"
            body="Browse 18+ prayers across 24 themes. Purchase any prayer for $7 and keep the audio, transcript, and meditation guide."
            cta="Visit the library"
          />
          <HowCard
            testId="howitworks-card-request"
            href="/custom-prayer"
            icon={<Heart className="h-6 w-6" />}
            kicker="Step 3"
            title="Request"
            body="Tell us your situation and a personalized prayer is hand-crafted for you ($10), delivered within 24–48 hours."
            cta="Request a prayer"
          />
        </div>
      </section>

      {/* SCRIPTURE BANNER */}
      <section className="surface-hero-navy" data-testid="section-scripture-banner">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <blockquote
            className="font-serif italic text-2xl md:text-3xl text-brand-cream/95 leading-relaxed"
            style={{ fontFamily: "var(--font-display)" }}
          >
            “He who dwells in the secret place of the Most High shall abide under the shadow of the Almighty.
            I will say of the Lord, ‘He is my refuge and my fortress; my God, in Him I will trust.’”
          </blockquote>
          <hr className="gold-divider" />
          <div className="text-xs uppercase tracking-[0.32em] text-brand-gold font-sans font-medium">
            Psalm 91:1–2
          </div>
        </div>
      </section>

      {/* FEATURED PRAYERS */}
      <section
        className="mx-auto max-w-7xl px-6 py-24 md:py-28"
        data-testid="section-featured-prayers"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-brand-gold mb-3 font-sans font-medium">
              Featured Prayers
            </div>
            <h2
              className="text-3xl md:text-4xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Hand-selected for this season
            </h2>
            <hr className="mt-4 w-16 h-px bg-brand-gold border-0 opacity-70" />
          </div>
          <Link
            href="/library"
            className="text-sm font-medium inline-flex items-center gap-1 text-foreground hover:text-brand-gold font-sans"
            data-testid="link-view-all-prayers"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {featured.map((p) => <PrayerCard key={p.id} prayer={p} />)}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section
        className="mx-auto max-w-3xl px-6 py-24 text-center"
        data-testid="section-newsletter"
      >
        <h2
          className="text-3xl md:text-4xl font-semibold tracking-tight mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Stay encouraged
        </h2>
        <hr className="gold-divider-thin" />
        <p className="text-muted-foreground mb-8 font-sans">
          A weekly Scripture and a fresh prayer in your inbox.
        </p>
        <NewsletterInline />
      </section>
    </PageShell>
  );
}

function HowCard({
  testId,
  href,
  icon,
  kicker,
  title,
  body,
  cta,
}: {
  testId: string;
  href: string;
  icon: React.ReactNode;
  kicker: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="group rounded-2xl border border-brand-gold/25 bg-card p-7 md:p-8 shadow-sm hover:shadow-lg hover:border-brand-gold/60 transition-all flex flex-col text-left"
    >
      <div className="w-14 h-14 rounded-full bg-brand-navy text-brand-gold inline-flex items-center justify-center mb-5 ring-1 ring-brand-gold/40 group-hover:ring-brand-gold transition-colors">
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-[0.28em] text-brand-gold mb-2 font-sans font-medium">
        {kicker}
      </div>
      <h3
        className="text-2xl font-semibold mb-3 tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed flex-1">
        {body}
      </p>
      <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-sans font-medium text-foreground group-hover:text-brand-gold transition-colors">
        {cta} <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function SubscribeCta() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function start() {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/create-subscription-checkout-session", {});
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data?.error || "Could not start subscription checkout.");
    } catch (err: any) {
      toast({
        title: "Subscription unavailable",
        description: err?.message ?? "Please try again later.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <div
      className="inline-flex flex-col sm:flex-row items-center gap-3 rounded-full bg-brand-cream/10 backdrop-blur border border-brand-gold/40 px-4 py-2.5"
      data-testid="hero-subscribe-cta"
    >
      <span className="text-sm font-sans text-brand-cream/90">
        <span className="font-semibold text-brand-gold">$27/month</span>
        <span className="text-brand-cream/70"> · Unlimited Prayers Subscription</span>
      </span>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        data-testid="button-subscribe-monthly"
        className="inline-flex items-center justify-center rounded-full bg-brand-gold text-brand-navy text-sm font-sans font-semibold px-5 h-9 hover:bg-brand-goldsoft transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Starting…
          </>
        ) : (
          "Subscribe Monthly"
        )}
      </button>
    </div>
  );
}

function NewsletterInline() {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const email = String(fd.get("email") || "");
        if (!email.includes("@")) return;
        setSubmitting(true);
        try {
          await apiRequest("POST", "/api/email/signup", { email, source: "homepage" });
          (e.target as HTMLFormElement).reset();
          toast({ title: "Subscribed — thank you." });
        } catch {
          toast({ title: "Something went wrong. Try again.", variant: "destructive" });
        } finally {
          setSubmitting(false);
        }
      }}
      className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
      data-testid="form-newsletter-home"
    >
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        className="flex-1 rounded-full border border-brand-gold/40 bg-card px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/60 focus:border-brand-gold"
        data-testid="input-newsletter-home"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-navy text-brand-cream text-sm font-semibold px-6 py-2.5 hover:bg-brand-blue transition-colors disabled:opacity-60"
        data-testid="button-newsletter-home"
      >
        {submitting ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
