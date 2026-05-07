import { Link } from "wouter";
import { Download, Heart, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { Scripture } from "@/components/brand/Scripture";
import { SectionDivider } from "@/components/brand/SectionDivider";
import { PrayerCard } from "@/components/brand/PrayerCard";
import { Button } from "@/components/ui/button";
import { categories, prayers } from "@/lib/data";

const HERO_CATEGORY_SLUGS = [
  "protection",
  "healing",
  "deliverance",
  "anxiety-peace",
  "forgiveness",
  "repentance",
  "marriage",
  "family",
  "children",
  "employment-provision",
  "wisdom-direction",
  "spiritual-warfare",
  "morning",
  "night",
  "against-fear",
  "purpose-calling",
];

const SHORT_NAME: Record<string, string> = {
  "anxiety-peace": "Anxiety & Peace",
  "employment-provision": "Employment & Provision",
  "wisdom-direction": "Wisdom & Direction",
  "spiritual-warfare": "Spiritual Warfare",
  "against-fear": "Against Fear",
  "purpose-calling": "Purpose & Calling",
  "freedom-addiction": "Freedom from Addiction",
  "identity-in-christ": "Identity in Christ",
  "grief-loss": "Grief & Loss",
  "court-of-heaven": "Court of Heaven",
  "relationship-restoration": "Relationship Restoration",
  "breaking-soul-ties": "Breaking Soul Ties",
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
      {/* HERO */}
      <section className="surface-cathedral border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-6 md:py-8 text-center space-y-3">
          <Scripture reference="Romans 8:26" align="center" size="md">
            Likewise the Spirit also helps in our weaknesses. For we do not know what we should pray for as we ought,
            but the Spirit Himself makes intercession for us…
          </Scripture>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Bible-rooted prayers for every season — listen, download, or request your own.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {heroCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/library?category=${c.slug}`}
                data-testid={`hero-chip-${c.slug}`}
                className="text-xs md:text-sm font-medium px-2.5 py-1 rounded-full border border-foreground/30 text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                {shortName(c.slug, c.name)}
              </Link>
            ))}
            <Link
              href="/library"
              data-testid="hero-chip-all"
              className="text-xs md:text-sm font-medium px-2.5 py-1 rounded-full border border-foreground bg-foreground text-background hover:bg-foreground/90"
            >
              All categories →
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link href="/free-prayer">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-semibold" data-testid="button-cta-free">
                Listen to a Free Prayer
              </Button>
            </Link>
            <Link href="/custom-prayer">
              <Button size="sm" variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background font-semibold" data-testid="button-cta-custom">
                Request Custom Prayer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="text-xs uppercase tracking-[0.18em] text-foreground/70 mb-2">Choose your path</div>
          <h2 className="headline text-2xl md:text-3xl">How it works</h2>
          <p className="text-sm text-muted-foreground mt-2">Two simple options — pick what fits your moment.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          <Link
            href="/library"
            data-testid="howitworks-option-purchase"
            className="group rounded-xl border border-foreground/15 bg-card p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 rounded-full bg-foreground text-background inline-flex items-center justify-center">
                <Download className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <h3 className="font-serif text-lg md:text-xl font-semibold">Purchase &amp; download a prayer</h3>
                <p className="text-sm text-muted-foreground">
                  Browse the library, buy any prayer for $7, and keep the audio, transcript, and meditation guide forever.
                </p>
                <div className="inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:text-brand-gold pt-1">
                  Browse the library <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
          <Link
            href="/custom-prayer"
            data-testid="howitworks-option-personalize"
            className="group rounded-xl border border-foreground/15 bg-card p-6 hover:border-foreground transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 rounded-full bg-foreground text-background inline-flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <h3 className="font-serif text-lg md:text-xl font-semibold">Personalize your prayer</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us your situation and we&apos;ll craft a custom prayer ($10), delivered in 24–48 hours.
                </p>
                <div className="inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:text-brand-gold pt-1">
                  Request a custom prayer <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <SectionDivider icon="dove" />

      {/* FEATURED PRAYERS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-2">Most Loved</div>
            <h2 className="headline text-3xl md:text-4xl">Popular Prayers</h2>
          </div>
          <Link href="/library" className="text-sm font-medium inline-flex items-center gap-1 text-foreground hover:text-brand-gold">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((p) => <PrayerCard key={p.id} prayer={p} />)}
        </div>
      </section>

      {/* SCRIPTURE BANNER */}
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <Scripture reference="Psalm 91:1–2" align="center" size="lg">
            <span className="text-white/95">
              He who dwells in the secret place of the Most High shall abide under the shadow of the Almighty.
              I will say of the Lord, “He is my refuge and my fortress; my God, in Him I will trust.”
            </span>
          </Scripture>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="headline text-3xl md:text-4xl mb-3">Stay encouraged</h2>
        <p className="text-muted-foreground mb-6">A weekly Scripture and a fresh prayer in your inbox.</p>
        <NewsletterInline />
      </section>
    </PageShell>
  );
}

function NewsletterInline() {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const email = String(fd.get("email") || "");
        if (!email.includes("@")) return;
        try {
          await fetch("/api/email/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, source: "homepage" }),
          });
          (e.target as HTMLFormElement).reset();
          alert("Subscribed — thank you.");
        } catch {
          alert("Something went wrong. Try again.");
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
        className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        data-testid="input-newsletter-home"
      />
      <button
        type="submit"
        className="rounded-md bg-brand-gold text-white text-sm font-semibold px-5 py-2 hover:bg-brand-goldsoft"
        data-testid="button-newsletter-home"
      >
        Subscribe
      </button>
    </form>
  );
}
