import { useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronRight, Lock, BookOpen, ArrowLeft, BookmarkPlus, FileText } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { Scripture } from "@/components/brand/Scripture";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/lib/data";
import { useAuth } from "@/lib/app-context";
import { apiRequest, queryClient } from "@/lib/queryClient";

type UploadedPrayerItem = {
  id: number;
  title: string;
  categorySlug: string;
  description: string;
  bibleTheme: string;
  supportingScripture: string;
  aboutPrayer: string;
  whatsIncluded: string;
  scriptureQuote: string;
  scriptureReference: string;
  categoryDescription: string;
  audioUrl: string | null;
  downloadUrl: string | null;
  durationSeconds: number;
  audioOriginalName: string;
  audioMimeType: string;
  audioSize: number;
  hasPdf?: boolean;
  pdfOriginalName?: string;
  pdfMimeType?: string;
  pdfSize?: number;
  pdfDownloadUrl?: string | null;
  createdAt: string;
  isFree: boolean;
  access: boolean;
  purchased: boolean;
  subscribed: boolean;
  priceCents: number;
};

function splitLines(s: string): string[] {
  return s
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function PrayerDetailPage() {
  const [, params] = useRoute<{ id: string }>("/prayer/:id");
  const idParam = params?.id ?? "";
  const id = Number(idParam);
  const { serverUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [buying, setBuying] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<{ ok: boolean; items: UploadedPrayerItem[] }>({
    queryKey: ["/api/uploaded-prayers"],
  });

  const prayer = useMemo(
    () => (data?.items ?? []).find((p) => p.id === id),
    [data, id],
  );

  const otherPrayers = useMemo(
    () => (data?.items ?? []).filter((p) => p.id !== id).slice(0, 3),
    [data, id],
  );

  if (isLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">Loading prayer…</div>
      </PageShell>
    );
  }

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

  const category = categories.find((c) => c.slug === prayer.categorySlug);
  const scriptureLines = splitLines(prayer.supportingScripture);
  const includedLines = splitLines(prayer.whatsIncluded);
  const priceLabel = `$${(prayer.priceCents / 100).toFixed(0)}`;

  async function buyPrayer() {
    if (!serverUser) {
      navigate("/login");
      return;
    }
    if (!prayer) return;
    setBuying(true);
    try {
      const res = await apiRequest(
        "POST",
        `/api/uploaded-prayers/${prayer.id}/create-checkout-session`,
        {},
      );
      const json = await res.json();
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error(json?.error || "Could not start checkout.");
    } catch (err: any) {
      toast({ title: "Checkout unavailable", description: err?.message || "Try again later.", variant: "destructive" });
      setBuying(false);
    }
  }

  async function saveToAccount() {
    if (!serverUser) {
      navigate("/account");
      return;
    }
    if (!prayer) return;
    setSaving(true);
    try {
      await apiRequest("POST", "/api/me/prayers", {
        source: "uploaded",
        prayerKey: String(prayer.id),
        title: prayer.title,
        categorySlug: prayer.categorySlug,
        description: prayer.description,
        audioUrl: prayer.audioUrl ?? "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me/prayers"] });
      toast({ title: "Saved", description: "Added to your account." });
    } catch (err: any) {
      toast({ title: "Could not save", description: err?.message || "Try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
          <Link href="/" className="hover:text-brand-gold">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/library" className="hover:text-brand-gold">Library</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]" data-testid="text-prayer-breadcrumb">
            {prayer.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
          <div className="md:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider">
              {category ? (
                <span className="rounded-full bg-brand-cream dark:bg-brand-gold/15 text-brand-navy dark:text-brand-gold font-medium px-2.5 py-1">
                  {category.name}
                </span>
              ) : null}
              <span className="text-muted-foreground">
                Uploaded {new Date(prayer.createdAt).toLocaleDateString()}
              </span>
              {prayer.isFree ? (
                <span
                  className="rounded-full bg-emerald-600 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
                  data-testid="badge-detail-free"
                >
                  Free
                </span>
              ) : null}
            </div>
            <h1 className="headline text-3xl md:text-5xl" data-testid="text-prayer-title">{prayer.title}</h1>
            {prayer.bibleTheme ? (
              <p className="text-lg text-muted-foreground" data-testid="text-prayer-bible-theme">
                {prayer.bibleTheme}
              </p>
            ) : null}

            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col gap-4">
              {prayer.hasPdf && !prayer.access ? (
                <div
                  className="text-[11px] uppercase tracking-wider text-brand-gold inline-flex items-center gap-1.5"
                  data-testid="badge-detail-has-pdf"
                >
                  <FileText className="h-3.5 w-3.5" /> Includes downloadable PDF
                </div>
              ) : null}

              {prayer.access && prayer.audioUrl ? (
                <audio
                  controls
                  preload="none"
                  src={prayer.audioUrl}
                  className="w-full"
                  data-testid="audio-prayer-detail"
                />
              ) : (
                <div className="rounded-md border border-dashed border-card-border bg-background/40 px-3 py-3 text-sm text-muted-foreground flex items-center gap-2" data-testid="audio-locked-detail">
                  <Lock className="h-4 w-4 text-brand-gold shrink-0" />
                  {!serverUser
                    ? prayer.isFree
                      ? "This is a free prayer — sign in to listen and download."
                      : "Sign in and unlock this prayer to listen."
                    : `Unlock this prayer for ${priceLabel}, or subscribe for unlimited listening.`}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={saveToAccount}
                  disabled={saving}
                  data-testid="button-detail-save"
                >
                  <BookmarkPlus className="h-4 w-4 mr-1.5" />
                  {serverUser ? (saving ? "Saving…" : "Save to account") : "Sign in to save"}
                </Button>
                {prayer.access && prayer.downloadUrl ? (
                  <>
                    <a
                      href={prayer.downloadUrl}
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-goldsoft"
                      data-testid="link-detail-download"
                    >
                      <Download className="h-4 w-4" /> Download MP3
                    </a>
                    {prayer.hasPdf && prayer.pdfDownloadUrl ? (
                      <a
                        href={prayer.pdfDownloadUrl}
                        className="inline-flex items-center gap-1.5 rounded-md border border-brand-gold/60 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/10"
                        data-testid="link-detail-pdf-download"
                      >
                        <FileText className="h-4 w-4" /> Download PDF
                      </a>
                    ) : null}
                  </>
                ) : prayer.isFree && !serverUser ? (
                  <Link href="/login">
                    <Button
                      className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
                      data-testid="button-detail-login-free"
                    >
                      <Lock className="h-4 w-4 mr-1.5" /> Log in for free access
                    </Button>
                  </Link>
                ) : prayer.isFree ? null : (
                  <Button
                    onClick={buyPrayer}
                    disabled={buying}
                    className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
                    data-testid="button-detail-purchase"
                  >
                    {buying ? "Starting…" : `Buy & Download — ${priceLabel}`}
                  </Button>
                )}
              </div>
              {!prayer.isFree ? (
                <p className="text-[11px] tracking-wide text-muted-foreground" data-testid="text-detail-promo-hint">
                  Have a promo code? Enter it at checkout.
                </p>
              ) : null}
            </div>
          </div>

          {/* SCRIPTURE QUOTE */}
          <div className="md:col-span-5">
            {prayer.scriptureQuote ? (
              <Scripture reference={prayer.scriptureReference || prayer.supportingScripture.split(/\r?\n/)[0] || ""}>
                {prayer.scriptureQuote}
              </Scripture>
            ) : null}
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mt-14 md:mt-20">
          <div className="md:col-span-8 space-y-10">
            {prayer.bibleTheme ? (
              <section>
                <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-2">Bible Theme</div>
                <p className="font-serif text-xl md:text-2xl leading-snug text-foreground" data-testid="text-detail-bible-theme">
                  {prayer.bibleTheme}
                </p>
              </section>
            ) : null}

            {scriptureLines.length > 0 ? (
              <section>
                <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">Supporting Scripture</div>
                <ul className="space-y-2" data-testid="list-detail-scripture">
                  {scriptureLines.map((s) => (
                    <li key={s} className="rounded-md border border-card-border bg-card p-3 inline-flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-brand-gold" />
                      <span className="font-medium">{s}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {prayer.aboutPrayer || prayer.description ? (
              <section>
                <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">About this prayer</div>
                <p className="text-foreground/85 leading-relaxed whitespace-pre-line" data-testid="text-detail-about">
                  {prayer.aboutPrayer || prayer.description}
                </p>
              </section>
            ) : null}

            {includedLines.length > 0 ? (
              <section>
                <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">What’s included</div>
                <ul className="space-y-1.5 text-sm" data-testid="list-detail-whats-included">
                  {includedLines.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-brand-gold" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="md:col-span-4 space-y-6">
            {category ? (
              <div className="rounded-xl border border-card-border bg-card p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Category</div>
                <Link href={`/library?category=${category.slug}`} className="font-serif text-lg font-semibold hover:text-brand-gold" data-testid="link-detail-category">
                  {category.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-detail-category-description">
                  {prayer.categoryDescription || category.description}
                </p>
              </div>
            ) : null}
          </aside>
        </div>

        {otherPrayers.length > 0 ? (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-6">
              <h2 className="headline text-2xl md:text-3xl">More prayers</h2>
              <Link href="/library" className="text-sm hover:text-brand-gold inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Back to library
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherPrayers.map((p) => {
                const cat = categories.find((c) => c.slug === p.categorySlug);
                return (
                  <Link
                    key={p.id}
                    href={`/prayer/${p.id}`}
                    className="rounded-xl border border-card-border bg-card p-5 hover-elevate flex flex-col gap-2"
                    data-testid={`card-other-prayer-${p.id}`}
                  >
                    <div className="text-[11px] uppercase tracking-wider text-brand-gold font-medium">
                      {cat?.name || p.categorySlug}
                    </div>
                    <h3 className="font-serif text-lg font-semibold leading-snug">{p.title}</h3>
                    {p.bibleTheme ? (
                      <p className="text-sm text-muted-foreground line-clamp-2 italic">{p.bibleTheme}</p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
