import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight, Filter, X, Download, FileText, Music, BookmarkPlus, Lock, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { SectionDivider } from "@/components/brand/SectionDivider";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/data";
import { useAuth } from "@/lib/app-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  audioOriginalName: string;
  audioMimeType: string;
  audioSize: number;
  durationSeconds: number;
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

type Sort = "newest" | "az";

export default function LibraryPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>(() => {
    if (typeof window === "undefined") return "all";
    const slug = new URLSearchParams(window.location.search).get("category");
    return slug && categories.some((c) => c.slug === slug) ? slug : "all";
  });

  useEffect(() => {
    const onPop = () => {
      const slug = new URLSearchParams(window.location.search).get("category");
      setCategory(slug && categories.some((c) => c.slug === slug) ? slug : "all");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const [sort, setSort] = useState<Sort>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: uploadedData, isLoading } = useQuery<{
    ok: boolean;
    items: UploadedPrayerItem[];
    subscribed: boolean;
    authenticated: boolean;
  }>({
    queryKey: ["/api/uploaded-prayers"],
  });
  const uploaded = uploadedData?.items ?? [];

  const { toast: libraryToast } = useToast();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const purchase = sp.get("purchase");
    if (purchase === "success") {
      libraryToast({ title: "Purchase complete", description: "Your prayer is unlocked." });
      queryClient.invalidateQueries({ queryKey: ["/api/uploaded-prayers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/purchases"] });
      sp.delete("purchase");
      sp.delete("session_id");
      sp.delete("prayer");
      const next = sp.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`);
    } else if (purchase === "cancelled") {
      libraryToast({ title: "Checkout cancelled", description: "No charge was made." });
    }
  }, [libraryToast]);

  const filtered = useMemo(() => {
    let items = uploaded.slice();
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (u) =>
          u.title.toLowerCase().includes(needle) ||
          u.description.toLowerCase().includes(needle) ||
          u.bibleTheme.toLowerCase().includes(needle) ||
          u.supportingScripture.toLowerCase().includes(needle),
      );
    }
    if (category !== "all") items = items.filter((u) => u.categorySlug === category);
    if (sort === "az") items.sort((a, b) => a.title.localeCompare(b.title));
    else items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return items;
  }, [uploaded, q, category, sort]);

  const clearAll = () => { setQ(""); setCategory("all"); setSort("newest"); };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
          <Link href="/" className="hover:text-brand-gold">Home</Link>
          <ChevronRight className="h-3 w-3" /><span className="text-foreground font-medium">Library</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="headline text-3xl md:text-4xl mb-1">Prayer Library</h1>
            <p className="text-muted-foreground">Spirit-led prayers, hand-recorded for every season.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="md:hidden inline-flex items-center gap-1 rounded-md border border-input bg-card px-3 py-2 text-sm hover-elevate"
              onClick={() => setFiltersOpen(true)}
              data-testid="button-open-filters"
            >
              <Filter className="h-4 w-4" /> Filters
            </button>
            <label className="sr-only" htmlFor="library-sort">Sort</label>
            <select
              id="library-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              data-testid="select-sort"
              className="rounded-md border border-input bg-card px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
            >
              <option value="newest">Sort: Newest</option>
              <option value="az">Sort: A–Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <aside className={`md:col-span-3 ${filtersOpen ? "fixed inset-0 z-40 bg-background overflow-y-auto p-5" : "hidden md:block"}`}>
            <div className="md:sticky md:top-20 space-y-6">
              <div className="md:hidden flex items-center justify-between">
                <div className="text-base font-semibold">Filters</div>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="hover-elevate p-2 rounded-md"><X className="h-4 w-4" /></button>
              </div>

              <div>
                <label htmlFor="search" className="text-xs uppercase tracking-wider text-muted-foreground">Search</label>
                <div className="relative mt-2">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="search"
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by title, scripture…"
                    data-testid="input-library-search"
                    className="w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Categories</div>
                <ul className="space-y-1 max-h-72 overflow-auto pr-1">
                  <li>
                    <button
                      onClick={() => setCategory("all")}
                      data-testid="filter-category-all"
                      className={`w-full text-left text-sm px-2.5 py-1.5 rounded-md hover-elevate ${category === "all" ? "bg-accent text-foreground font-medium" : "text-foreground/80"}`}
                    >All categories</button>
                  </li>
                  {categories.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setCategory(c.slug)}
                        data-testid={`filter-category-${c.slug}`}
                        className={`w-full text-left text-sm px-2.5 py-1.5 rounded-md hover-elevate ${category === c.slug ? "bg-accent text-foreground font-medium" : "text-foreground/80"}`}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <Button variant="ghost" className="w-full" onClick={clearAll} data-testid="button-clear-filters">Clear filters</Button>
              </div>
            </div>
          </aside>

          <section className="md:col-span-9">
            <div className="text-sm text-muted-foreground mb-4" data-testid="text-library-count">
              {isLoading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "prayer" : "prayers"}`}
            </div>
            {isLoading ? null : filtered.length === 0 ? (
              uploaded.length === 0 ? (
                <ComingSoonState />
              ) : (
                <EmptyState onClear={clearAll} />
              )
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((u) => (
                    <UploadedPrayerCard key={u.id} item={u} />
                  ))}
                </div>
                <div className="mt-12">
                  <SectionDivider icon="flame" />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function UploadedPrayerCard({ item }: { item: UploadedPrayerItem }) {
  const cat = categories.find((c) => c.slug === item.categorySlug);
  const { serverUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [saving, setSaving] = useState(false);
  const [buying, setBuying] = useState(false);

  async function saveToAccount() {
    if (!serverUser) {
      navigate("/account");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("POST", "/api/me/prayers", {
        source: "uploaded",
        prayerKey: String(item.id),
        title: item.title,
        categorySlug: item.categorySlug,
        description: item.description,
        audioUrl: item.audioUrl ?? "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me/prayers"] });
      toast({ title: "Saved", description: "Added to your account." });
    } catch (err: any) {
      toast({ title: "Could not save", description: err?.message || "Try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function buyPrayer() {
    if (!serverUser) {
      navigate("/login");
      return;
    }
    setBuying(true);
    try {
      const res = await apiRequest(
        "POST",
        `/api/uploaded-prayers/${item.id}/create-checkout-session`,
        {},
      );
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data?.error || "Could not start checkout.");
    } catch (err: any) {
      toast({ title: "Checkout unavailable", description: err?.message || "Try again later.", variant: "destructive" });
      setBuying(false);
    }
  }

  const priceLabel = `$${(item.priceCents / 100).toFixed(0)}`;

  return (
    <article
      className="rounded-xl border border-card-border bg-card p-4 flex flex-col gap-3"
      data-testid={`card-uploaded-prayer-${item.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-foreground/70 flex items-center gap-1">
            <Music className="h-3 w-3" />
            <span>{cat?.name || item.categorySlug}</span>
          </div>
          <Link
            href={`/prayer/${item.id}`}
            className="block mt-1"
            data-testid={`link-uploaded-card-${item.id}`}
          >
            <h3
              className="font-serif text-lg leading-snug font-semibold tracking-tight hover:text-brand-gold"
              data-testid={`text-uploaded-card-title-${item.id}`}
            >
              {item.title}
            </h3>
          </Link>
        </div>
        {item.isFree ? (
          <span
            className="shrink-0 rounded-full bg-emerald-600 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
            data-testid={`badge-library-free-${item.id}`}
          >
            Free
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-foreground text-background text-[10px] font-medium px-2 py-0.5">
            New
          </span>
        )}
      </div>
      {item.bibleTheme ? (
        <p className="text-sm text-muted-foreground line-clamp-2 italic" data-testid={`text-uploaded-card-theme-${item.id}`}>
          {item.bibleTheme}
        </p>
      ) : item.description ? (
        <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
      ) : null}

      {item.hasPdf && !item.access ? (
        <div
          className="text-[11px] uppercase tracking-wider text-brand-gold inline-flex items-center gap-1"
          data-testid={`badge-library-has-pdf-${item.id}`}
        >
          <FileText className="h-3 w-3" /> Includes PDF
        </div>
      ) : null}

      {item.access && item.audioUrl ? (
        <audio
          controls
          preload="none"
          src={item.audioUrl}
          className="w-full h-9"
          data-testid={`audio-library-uploaded-${item.id}`}
        />
      ) : (
        <div
          className="rounded-md border border-dashed border-card-border bg-background/40 px-3 py-3 text-xs text-muted-foreground flex items-center gap-2"
          data-testid={`audio-locked-uploaded-${item.id}`}
        >
          <Lock className="h-4 w-4 text-brand-gold shrink-0" />
          {!serverUser
            ? item.isFree
              ? "Free prayer — sign in to listen and download."
              : "Sign in and unlock to listen."
            : item.subscribed
              ? "Loading your subscription…"
              : `Unlock this prayer for ${priceLabel}, or subscribe for unlimited listening.`}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
        <button
          type="button"
          onClick={saveToAccount}
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand-gold disabled:opacity-50"
          data-testid={`button-save-uploaded-${item.id}`}
        >
          <BookmarkPlus className="h-4 w-4" /> {serverUser ? "Save to account" : "Sign in to save"}
        </button>

        {item.access && item.downloadUrl ? (
          <div className="inline-flex items-center gap-3 flex-wrap">
            <a
              href={item.downloadUrl}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand-gold"
              data-testid={`link-download-uploaded-${item.id}`}
            >
              <Download className="h-4 w-4" /> Download MP3
            </a>
            {item.hasPdf && item.pdfDownloadUrl ? (
              <a
                href={item.pdfDownloadUrl}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand-gold"
                data-testid={`link-download-pdf-${item.id}`}
              >
                <FileText className="h-4 w-4" /> Download PDF
              </a>
            ) : null}
          </div>
        ) : !serverUser ? (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-gold hover:underline"
            data-testid={`link-login-uploaded-${item.id}`}
          >
            <Lock className="h-4 w-4" /> {item.isFree ? "Log in for free access" : "Log in to listen"}
          </Link>
        ) : item.isFree ? null : (
          <button
            type="button"
            onClick={buyPrayer}
            disabled={buying}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-gold px-3 py-1.5 text-sm font-semibold text-brand-navy hover:bg-brand-goldsoft disabled:opacity-60"
            data-testid={`button-buy-uploaded-${item.id}`}
          >
            {buying ? "Starting…" : `Buy for ${priceLabel}`}
          </button>
        )}
      </div>

      <Link
        href={`/prayer/${item.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-gold"
        data-testid={`link-detail-uploaded-${item.id}`}
      >
        Read full Scripture and notes <ArrowRight className="h-3 w-3" />
      </Link>
    </article>
  );
}

function ComingSoonState() {
  return (
    <div className="rounded-xl border border-dashed border-card-border p-12 text-center bg-card" data-testid="state-library-coming-soon">
      <svg width="48" height="48" viewBox="0 0 64 64" className="mx-auto mb-4 text-brand-gold" fill="none" aria-hidden="true">
        <path d="M16 36 Q24 22 36 26 Q48 28 50 38 Q44 40 38 36 Q34 46 24 46 Q18 44 16 36 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
      </svg>
      <h3 className="font-serif text-xl font-semibold">New prayers coming soon</h3>
      <p className="text-muted-foreground text-sm mt-1 mb-4 max-w-sm mx-auto">
        Spirit-led prayer recordings are on their way. Check back shortly, or request a custom prayer for your situation.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/custom-prayer">
          <Button variant="outline">Request a custom prayer</Button>
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-card-border p-12 text-center bg-card">
      <svg width="48" height="48" viewBox="0 0 64 64" className="mx-auto mb-4 text-brand-gold" fill="none" aria-hidden="true">
        <path d="M16 36 Q24 22 36 26 Q48 28 50 38 Q44 40 38 36 Q34 46 24 46 Q18 44 16 36 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
      </svg>
      <h3 className="font-serif text-xl font-semibold">No prayers found</h3>
      <p className="text-muted-foreground text-sm mt-1 mb-4 max-w-sm mx-auto">
        Try a different category or search term.
      </p>
      <Button variant="outline" onClick={onClear} data-testid="button-empty-clear">Clear filters</Button>
    </div>
  );
}
