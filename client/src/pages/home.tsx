import { Link } from "wouter";
import { Headphones, Download, Heart, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { Scripture } from "@/components/brand/Scripture";
import { SectionDivider } from "@/components/brand/SectionDivider";
import { PrayerCard } from "@/components/brand/PrayerCard";
import { Button } from "@/components/ui/button";
import { prayers } from "@/lib/data";

export default function HomePage() {
  const featured = prayers.filter((p) => p.isFeatured).slice(0, 6);
  return (
    <PageShell>
      {/* HERO */}
      <section className="surface-cathedral border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28 text-center space-y-8">
          <Scripture reference="Romans 8:26" align="center" size="lg">
            Likewise the Spirit also helps in our weaknesses. For we do not know what we should pray for as we ought,
            but the Spirit Himself makes intercession for us…
          </Scripture>
          <h1 className="headline text-4xl md:text-5xl lg:text-6xl text-foreground" data-testid="text-hero-headline">
            Let the Holy Spirit <span className="text-brand-gold">Pray Through You</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Bible-rooted prayers for every season of life. Listen, download, or request your own —
            so that when words fail, prayer doesn’t.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/free-prayer">
              <Button size="lg" className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-cta-free">
                Listen to a Free Prayer
              </Button>
            </Link>
            <Link href="/library">
              <Button size="lg" variant="outline" className="border-brand-navy text-brand-navy dark:text-foreground dark:border-foreground/30" data-testid="button-cta-library">
                Browse Prayer Library
              </Button>
            </Link>
            <Link href="/custom-prayer">
              <Button size="lg" className="bg-brand-blue hover:bg-brand-blue/90 text-brand-navy font-semibold" data-testid="button-cta-custom">
                Request Custom Prayer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">A Simple Rhythm</div>
          <h2 className="headline text-3xl md:text-4xl">How it works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Headphones, title: "Listen", desc: "Preview any prayer before you buy. Stream a 30–60 second sample on every prayer detail page." },
            { icon: Download,  title: "Download", desc: "Purchase ($7) and keep your prayer forever — full audio, transcript, and meditation guide." },
            { icon: Heart,     title: "Personalize", desc: "Request a custom prayer ($10) crafted from your situation. Delivered in 24–48 hours." },
          ].map((step, i) => (
            <div key={step.title} className="rounded-xl border border-card-border bg-card p-7 text-center space-y-3 hover-elevate">
              <div className="mx-auto w-12 h-12 rounded-full bg-brand-cream dark:bg-brand-gold/20 text-brand-gold inline-flex items-center justify-center">
                <step.icon className="h-5 w-5" />
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">Step {i + 1}</div>
              <h3 className="font-serif text-xl font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
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

      {/* TESTIMONIALS */}
      <section className="bg-brand-cream dark:bg-card/40 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">From the Community</div>
            <h2 className="headline text-3xl md:text-4xl text-brand-navy dark:text-foreground">Encouragement, in their words</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Hannah C.", text: "I’ve been listening to Psalm 91 every morning for two months. The peace in my home has shifted. This is more than an app — it’s a sanctuary." },
              { name: "Marcus R.", text: "I bought the Anxiety prayer the week my dad got sick. It met me at a level my own words couldn’t. Worth far more than $7." },
              { name: "Priscilla A.", text: "Asked for a custom prayer for my marriage. The audio was Scripture-rich and tender. We pray it together now." },
            ].map((t) => (
              <figure key={t.name} className="rounded-xl bg-white dark:bg-card border border-card-border p-7 shadow-sm">
                <div aria-hidden className="text-4xl font-serif text-brand-gold leading-none">“</div>
                <blockquote className="text-brand-navy dark:text-foreground leading-relaxed font-serif italic mt-2">
                  {t.text}
                </blockquote>
                <figcaption className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">— {t.name}</figcaption>
              </figure>
            ))}
          </div>
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
        className="rounded-md bg-brand-gold text-brand-navy text-sm font-semibold px-5 py-2 hover:bg-brand-goldsoft"
        data-testid="button-newsletter-home"
      >
        Subscribe
      </button>
    </form>
  );
}
