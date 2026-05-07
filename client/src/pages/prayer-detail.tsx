import { useState } from "react";
import { Link, useRoute } from "wouter";
import { Play, Pause, Download, ChevronRight, Heart, Lock, BookOpen, ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { PrayerArt } from "@/components/brand/PrayerArt";
import { PrayerCard } from "@/components/brand/PrayerCard";
import { SectionDivider } from "@/components/brand/SectionDivider";
import { Scripture } from "@/components/brand/Scripture";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getPrayerBySlug, getRelated, getCategoryBySlug, formatDuration } from "@/lib/data";
import { usePlayer } from "@/lib/app-context";

export default function PrayerDetailPage() {
  const [, params] = useRoute<{ slug: string }>("/prayer/:slug");
  const slug = params?.slug ?? "";
  const prayer = getPrayerBySlug(slug);
  const { play, pause, isPlaying, prayer: current, purchase, isOwned, toggleFavorite, isFavorite } = usePlayer();
  const { toast } = useToast();
  const [purchasedAt, setPurchasedAt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!prayer) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="headline text-3xl mb-3">Prayer not found</h1>
          <p className="text-muted-foreground mb-6">We couldn’t find that prayer. It may have moved.</p>
          <Link href="/library"><Button variant="outline">Back to Library</Button></Link>
        </div>
      </PageShell>
    );
  }

  const category = getCategoryBySlug(prayer.categorySlug);
  const owned = isOwned(prayer.slug) || prayer.isFree;
  const isThisPlaying = current?.id === prayer.id && isPlaying;

  const scriptureFullTextMock: Record<string, string> = {
    "Romans 8:26": "Likewise the Spirit also helps in our weaknesses. For we do not know what we should pray for as we ought, but the Spirit Himself makes intercession for us with groanings which cannot be uttered.",
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
          <Link href="/" className="hover:text-brand-gold">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/library" className="hover:text-brand-gold">Library</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{prayer.title}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
          {/* HERO ART */}
          <div className="md:col-span-5">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg">
              <PrayerArt prayer={prayer} className="absolute inset-0" rounded="rounded-none" />
              <button
                onClick={() => isThisPlaying ? pause() : play(prayer)}
                className="absolute bottom-5 left-5 rounded-full bg-brand-gold text-brand-navy p-4 shadow-lg hover:bg-brand-goldsoft"
                aria-label={isThisPlaying ? "Pause preview" : "Play preview"}
                data-testid="button-detail-play"
              >
                {isThisPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
              </button>
              <button
                onClick={() => toggleFavorite(prayer.slug)}
                aria-label="Toggle favorite"
                aria-pressed={isFavorite(prayer.slug)}
                data-testid="button-detail-favorite"
                className={`absolute top-5 right-5 rounded-full p-2.5 backdrop-blur-md ${
                  isFavorite(prayer.slug) ? "bg-brand-gold/90 text-brand-navy" : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                <Heart className="h-4 w-4" fill={isFavorite(prayer.slug) ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {/* HERO TEXT + PURCHASE */}
          <div className="md:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider">
              <span className="rounded-full bg-brand-cream dark:bg-brand-gold/15 text-brand-navy dark:text-brand-gold font-medium px-2.5 py-1">
                {category?.name}
              </span>
              <span className="text-muted-foreground">{formatDuration(prayer.durationSeconds)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{prayer.playCount.toLocaleString()} plays</span>
            </div>
            <h1 className="headline text-3xl md:text-5xl" data-testid="text-prayer-title">{prayer.title}</h1>
            <p className="text-lg text-muted-foreground">{prayer.bibleTheme}</p>

            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {prayer.isFree ? (
                  <div className="text-sm">
                    <div className="font-serif text-2xl font-semibold text-brand-gold">Free</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Sample prayer · email required for download</div>
                  </div>
                ) : owned ? (
                  <div className="text-sm">
                    <div className="font-serif text-2xl font-semibold text-foreground">Owned</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{purchasedAt ? `Purchased ${purchasedAt}` : "In your library"}</div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <div className="font-serif text-2xl font-semibold text-foreground">${prayer.price.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">One-time purchase · download forever</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => isThisPlaying ? pause() : play(prayer)} data-testid="button-detail-preview">
                  {isThisPlaying ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
                  Preview
                </Button>
                {owned ? (
                  <Button
                    className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
                    data-testid="button-detail-download"
                    onClick={() => toast({ title: "Download started", description: "Your prayer audio is on its way (mock)." })}
                  >
                    <Download className="h-4 w-4 mr-1.5" /> Download
                  </Button>
                ) : (
                  <Button
                    className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
                    data-testid="button-detail-purchase"
                    onClick={() => {
                      // mock purchase flow
                      purchase(prayer.slug);
                      const today = new Date().toLocaleDateString();
                      setPurchasedAt(today);
                      toast({ title: "Purchase complete (mock)", description: `${prayer.title} is now in your library.` });
                    }}
                  >
                    Buy & Download — $7
                  </Button>
                )}
              </div>
            </div>

            {!owned && !prayer.isFree ? (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Stripe checkout is stubbed in this preview — purchases are mocked.
              </p>
            ) : null}
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mt-14 md:mt-20">
          <div className="md:col-span-8 space-y-10">
            <section>
              <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-2">Bible Theme</div>
              <p className="font-serif text-xl md:text-2xl leading-snug text-foreground">{prayer.bibleTheme}</p>
            </section>

            <section>
              <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">Supporting Scripture</div>
              <ul className="space-y-2">
                {prayer.scriptures.map((s) => (
                  <li key={s} className="rounded-md border border-card-border bg-card p-3">
                    <button
                      className="w-full flex items-center justify-between text-left"
                      onClick={() => setExpanded((e) => ({ ...e, [s]: !e[s] }))}
                      aria-expanded={!!expanded[s]}
                      data-testid={`button-scripture-${s.replace(/\W+/g, "-")}`}
                    >
                      <span className="font-medium inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-brand-gold" />{s}</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${expanded[s] ? "rotate-90" : ""}`} />
                    </button>
                    {expanded[s] ? (
                      <p className="mt-3 text-sm font-serif italic text-foreground/85">
                        {scriptureFullTextMock[s] ?? "Tap to open this Scripture in your preferred Bible app — full text would load here in production."}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">About this prayer</div>
              <p className="text-foreground/85 leading-relaxed">{prayer.description}</p>
            </section>

            <section>
              <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">What’s included</div>
              <ul className="space-y-1.5 text-sm">
                {prayer.whatsIncluded.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="md:col-span-4 space-y-6">
            <Scripture reference="Romans 8:26">
              Likewise the Spirit also helps in our weaknesses. For we do not know what we should pray for as we ought,
              but the Spirit Himself makes intercession for us…
            </Scripture>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Category</div>
              <Link href="/library" className="font-serif text-lg font-semibold hover:text-brand-gold">{category?.name}</Link>
              <p className="text-sm text-muted-foreground mt-1">{category?.description}</p>
            </div>
          </aside>
        </div>

        <div className="my-16">
          <SectionDivider icon="flame" />
        </div>

        {/* RELATED */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <h2 className="headline text-2xl md:text-3xl">You may also like</h2>
            <Link href="/library" className="text-sm hover:text-brand-gold inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back to library</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {getRelated(prayer, 3).map((p) => <PrayerCard key={p.id} prayer={p} />)}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
