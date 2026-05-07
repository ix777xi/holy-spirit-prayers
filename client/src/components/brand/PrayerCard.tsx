import { Link } from "wouter";
import { Play, Heart, Headphones, Clock } from "lucide-react";
import { Prayer, formatDuration, getCategoryBySlug } from "@/lib/data";
import { PrayerArt } from "./PrayerArt";
import { usePlayer } from "@/lib/app-context";

export function PrayerCard({ prayer, compact = false }: { prayer: Prayer; compact?: boolean }) {
  const { play, toggleFavorite, isFavorite } = usePlayer();
  const category = getCategoryBySlug(prayer.categorySlug);
  const fav = isFavorite(prayer.slug);

  return (
    <article
      className="group rounded-xl border border-card-border bg-card overflow-hidden hover-elevate"
      data-testid={`card-prayer-${prayer.slug}`}
    >
      <div className="relative aspect-[16/10]">
        <PrayerArt prayer={prayer} className="absolute inset-0" rounded="rounded-none" />
        <button
          onClick={(e) => { e.preventDefault(); play(prayer); }}
          className="absolute bottom-3 right-3 rounded-full bg-brand-gold text-brand-navy p-3 shadow-md hover:bg-brand-goldsoft focus-visible:ring-2 focus-visible:ring-brand-gold"
          aria-label={`Play preview of ${prayer.title}`}
          data-testid={`button-preview-${prayer.slug}`}
        >
          <Play className="h-4 w-4" fill="currentColor" />
        </button>

        <button
          onClick={(e) => { e.preventDefault(); toggleFavorite(prayer.slug); }}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={fav}
          data-testid={`button-favorite-${prayer.slug}`}
          className={`absolute top-3 right-3 rounded-full p-2 backdrop-blur-md ${
            fav ? "bg-brand-gold/90 text-brand-navy" : "bg-white/15 text-white hover:bg-white/25"
          }`}
        >
          <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
        </button>

        {prayer.isFree ? (
          <span className="absolute top-3 left-3 rounded-full bg-brand-cream text-brand-navy text-xs font-medium px-2.5 py-1 shadow-sm">
            Free
          </span>
        ) : (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 dark:bg-card text-foreground text-xs font-medium px-2.5 py-1 shadow-sm">
            ${prayer.price}
          </span>
        )}
      </div>

      <Link
        href={`/prayer/${prayer.slug}`}
        className="block p-4 space-y-2"
        data-testid={`link-prayer-${prayer.slug}`}
      >
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="text-brand-gold font-medium">{category?.name ?? "Prayer"}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(prayer.durationSeconds)}</span>
        </div>
        <h3 className="font-serif text-lg leading-snug font-semibold tracking-tight">
          {prayer.title}
        </h3>
        {!compact ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{prayer.description}</p>
        ) : null}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          <span className="inline-flex items-center gap-1"><Headphones className="h-3 w-3" />{prayer.playCount.toLocaleString()}</span>
          <span aria-hidden>·</span>
          <span>{prayer.purchaseCount.toLocaleString()} purchases</span>
        </div>
      </Link>
    </article>
  );
}
