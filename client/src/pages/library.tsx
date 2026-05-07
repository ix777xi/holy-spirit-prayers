import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight, Filter, X, Download, Music, BookmarkPlus } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { PrayerCard } from "@/components/brand/PrayerCard";
import { SectionDivider } from "@/components/brand/SectionDivider";
import { Button } from "@/components/ui/button";
import { categories, prayers, durationBucket } from "@/lib/data";
import { useAuth } from "@/lib/app-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type UploadedPrayerItem = {
  id: number;
  title: string;
  categorySlug: string;
  description: string;
  audioUrl: string;
  audioOriginalName: string;
  audioMimeType: string;
  audioSize: number;
  durationSeconds: number;
  createdAt: string;
};

type PriceFilter = "all" | "free" | "paid";
type DurationFilter = "all" | "short" | "medium" | "long";
type Sort = "newest" | "popular" | "az";

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
  const [price, setPrice] = useState<PriceFilter>("all");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [sort, setSort] = useState<Sort>("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: uploadedData } = useQuery<{ ok: boolean; items: UploadedPrayerItem[] }>({
    queryKey: ["/api/uploaded-prayers"],
  });
  const uploaded = uploadedData?.items ?? [];

  const filteredUploaded = useMemo(() => {
    let items = uploaded.slice();
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (u) =>
          u.title.toLowerCase().includes(needle) ||
          u.description.toLowerCase().includes(needle),
      );
    }
    if (category !== "all") items = items.filter((u) => u.categorySlug === category);
    return items;
  }, [uploaded, q, category]);

  const filtered = useMemo(() => {
    let items = prayers.slice();
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle) ||
          p.scriptures.join(" ").toLowerCase().includes(needle),
      );
    }
    if (category !== "all") items = items.filter((p) => p.categorySlug === category);
    if (price === "free") items = items.filter((p) => p.isFree);
    if (price === "paid") items = items.filter((p) => !p.isFree);
    if (duration !== "all") items = items.filter((p) => durationBucket(p.durationSeconds) === duration);

    if (sort === "newest") items = items.slice().reverse();
    else if (sort === "popular") items.sort((a, b) => b.playCount - a.playCount);
    else if (sort === "az") items.sort((a, b) => a.title.localeCompare(b.title));
    return items;
  }, [q, category, price, duration, sort]);

  const clearAll = () => { setQ(""); setCategory("all"); setPrice("all"); setDuration("all"); setSort("popular"); };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
          <Link href="/" className="hover:text-brand-gold">Home</Link>
          <ChevronRight className="h-3 w-3" /><span className="text-foreground font-medium">Library</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="headline text-3xl md:text-4xl mb-1">Prayer Library</h1>
            <p className="text-muted-foreground">Find the prayer you need today.</p>
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
              <option value="popular">Sort: Popular</option>
              <option value="newest">Sort: Newest</option>
              <option value="az">Sort: A–Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar */}
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

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Price</div>
                <div className="flex flex-wrap gap-2">
                  {(["all","free","paid"] as PriceFilter[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrice(p)}
                      data-testid={`filter-price-${p}`}
                      className={`rounded-full border px-3 py-1 text-xs ${price === p ? "border-brand-gold bg-brand-gold/15 text-foreground" : "border-input bg-card text-foreground/80"}`}
                    >
                      {p === "all" ? "All" : p === "free" ? "Free" : "Paid ($7)"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Duration</div>
                <div className="flex flex-wrap gap-2">
                  {(["all","short","medium","long"] as DurationFilter[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      data-testid={`filter-duration-${d}`}
                      className={`rounded-full border px-3 py-1 text-xs ${duration === d ? "border-brand-gold bg-brand-gold/15 text-foreground" : "border-input bg-card text-foreground/80"}`}
                    >
                      {d === "all" ? "Any" : d === "short" ? "< 5 min" : d === "medium" ? "5–15 min" : "15+ min"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button variant="ghost" className="w-full" onClick={clearAll} data-testid="button-clear-filters">Clear filters</Button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <section className="md:col-span-9">
            <div className="text-sm text-muted-foreground mb-4">
              {filtered.length + filteredUploaded.length}{" "}
              {filtered.length + filteredUploaded.length === 1 ? "prayer" : "prayers"}
            </div>
            {filteredUploaded.length > 0 ? (
              <div className="mb-8" data-testid="section-uploaded-prayers">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-serif text-lg md:text-xl">Newest uploads</h2>
                  <span className="text-xs text-muted-foreground">{filteredUploaded.length} new</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredUploaded.map((u) => (
                    <UploadedPrayerCard key={u.id} item={u} />
                  ))}
                </div>
              </div>
            ) : null}
            {filtered.length === 0 && filteredUploaded.length === 0 ? (
              <EmptyState onClear={clearAll} />
            ) : (
              <>
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((p) => <PrayerCard key={p.id} prayer={p} />)}
                  </div>
                ) : null}
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
        audioUrl: item.audioUrl,
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
          <h3
            className="font-serif text-lg leading-snug font-semibold tracking-tight mt-1"
            data-testid={`text-uploaded-card-title-${item.id}`}
          >
            {item.title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-foreground text-background text-[10px] font-medium px-2 py-0.5">
          New
        </span>
      </div>
      {item.description ? (
        <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
      ) : null}
      <audio
        controls
        preload="none"
        src={item.audioUrl}
        className="w-full h-9"
        data-testid={`audio-library-uploaded-${item.id}`}
      />
      <div className="flex items-center justify-between pt-1 gap-2">
        <button
          type="button"
          onClick={saveToAccount}
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand-gold disabled:opacity-50"
          data-testid={`button-save-uploaded-${item.id}`}
        >
          <BookmarkPlus className="h-4 w-4" /> {serverUser ? "Save to account" : "Sign in to save"}
        </button>
        <a
          href={item.audioUrl}
          download={item.audioOriginalName || `${item.title}.mp3`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand-gold"
          data-testid={`link-download-uploaded-${item.id}`}
        >
          <Download className="h-4 w-4" /> Download MP3
        </a>
      </div>
    </article>
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
        Try a different category or search term — there are still many prayers waiting to meet your need.
      </p>
      <Button variant="outline" onClick={onClear} data-testid="button-empty-clear">Clear filters</Button>
    </div>
  );
}
