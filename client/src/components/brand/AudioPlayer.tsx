import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Play, Pause, Download, X, Lock } from "lucide-react";
import { usePlayer } from "@/lib/app-context";
import { formatDuration } from "@/lib/data";
import { PrayerArt } from "./PrayerArt";

/**
 * Persistent mini audio player that floats above content.
 * - Play/pause + progress bar
 * - Shows download button if user owns prayer (post-purchase) or it's been unlocked
 */
export function MiniAudioPlayer() {
  const { prayer, isPlaying, position, toggle, seek, close, isOwned, unlocked } = usePlayer();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const pct = prayer ? Math.min(100, (position / prayer.durationSeconds) * 100) : 0;
    ref.current.style.setProperty("--progress", `${pct}%`);
  }, [position, prayer]);

  if (!prayer) return null;

  const downloadable = isOwned(prayer.slug) || unlocked.has(prayer.slug) || prayer.isFree;
  const pct = Math.min(100, (position / prayer.durationSeconds) * 100);

  return (
    <div
      role="region"
      aria-label="Audio player"
      className="fixed bottom-3 inset-x-3 md:left-auto md:right-6 md:bottom-6 z-50 max-w-xl md:w-[36rem]"
      data-testid="player-mini"
    >
      <div ref={ref} className="rounded-xl border border-border/70 bg-card/95 backdrop-blur shadow-xl overflow-hidden">
        <div className="flex items-stretch gap-3 p-3">
          <Link href={`/prayer/${prayer.slug}`} className="shrink-0 hover-elevate rounded-lg" aria-label={`Open ${prayer.title}`}>
            <div className="w-14 h-14 md:w-16 md:h-16 relative">
              <PrayerArt prayer={prayer} className="absolute inset-0" rounded="rounded-lg" />
            </div>
          </Link>
          <div className="min-w-0 flex-1 flex flex-col justify-between">
            <div className="min-w-0">
              <Link href={`/prayer/${prayer.slug}`} className="block">
                <div className="font-serif text-base md:text-lg font-semibold leading-tight truncate" data-testid="text-player-title">
                  {prayer.title}
                </div>
              </Link>
              <div className="text-xs text-muted-foreground truncate">
                {prayer.isFree ? "Free preview" : `Preview · $${prayer.price}`}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] tabular-nums text-muted-foreground w-9">{formatDuration(position)}</span>
              <input
                type="range"
                min={0}
                max={prayer.durationSeconds}
                value={position}
                onChange={(e) => seek(parseInt(e.target.value, 10))}
                className="player-progress flex-1"
                style={{ ["--progress" as any]: `${pct}%` }}
                aria-label="Audio progress"
                data-testid="input-player-progress"
              />
              <span className="text-[11px] tabular-nums text-muted-foreground w-9 text-right">
                {formatDuration(prayer.durationSeconds)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              data-testid="button-player-toggle"
              className="rounded-full bg-brand-gold text-brand-navy p-3 hover:bg-brand-goldsoft transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
            </button>
            <button
              aria-label={downloadable ? "Download" : "Locked"}
              data-testid="button-player-download"
              disabled={!downloadable}
              className={`p-2 rounded-md ${downloadable ? "hover-elevate text-foreground" : "text-muted-foreground/60 cursor-not-allowed"}`}
              title={downloadable ? "Download (mock)" : "Purchase to download"}
            >
              {downloadable ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
            <button onClick={close} aria-label="Close player" data-testid="button-player-close" className="hover-elevate p-2 rounded-md text-foreground/70">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
