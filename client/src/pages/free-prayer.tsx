import { useState } from "react";
import { Link } from "wouter";
import { Play, Pause, Download, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { Scripture } from "@/components/brand/Scripture";
import { Button } from "@/components/ui/button";
import { PrayerArt } from "@/components/brand/PrayerArt";
import { prayers, formatDuration } from "@/lib/data";
import { usePlayer, useAuth } from "@/lib/app-context";
import { apiRequest } from "@/lib/queryClient";

export default function FreePrayerPage() {
  const free = prayers.find((p) => p.isFree)!;
  const { play, pause, isPlaying, prayer: current, position, seek, unlockDownload, unlocked } = usePlayer();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isUnlocked = !!user || unlocked.has(free.slug);
  const isThisPlaying = current?.id === free.id && isPlaying;
  const pct = current?.id === free.id ? Math.min(100, (position / free.durationSeconds) * 100) : 0;

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/email/signup", { email, source: "free-prayer" });
    } catch {/* noop */}
    setSubmitting(false);
    unlockDownload(free.slug);
  }

  return (
    <PageShell>
      <section className="surface-cathedral border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">Free sample · No purchase required</div>
            <h1 className="headline text-3xl md:text-5xl mb-4" data-testid="text-free-title">{free.title}</h1>
            <p className="text-muted-foreground mb-6">{free.bibleTheme}</p>

            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => isThisPlaying ? pause() : play(free)}
                  className="rounded-full bg-brand-gold text-brand-navy p-3 hover:bg-brand-goldsoft"
                  aria-label={isThisPlaying ? "Pause" : "Play"}
                  data-testid="button-free-toggle"
                >
                  {isThisPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-lg font-semibold leading-tight">{free.title}</div>
                  <div className="text-xs text-muted-foreground">Full prayer · {formatDuration(free.durationSeconds)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] tabular-nums text-muted-foreground w-9">{formatDuration(current?.id === free.id ? position : 0)}</span>
                <input
                  type="range"
                  min={0}
                  max={free.durationSeconds}
                  value={current?.id === free.id ? position : 0}
                  onChange={(e) => { if (current?.id === free.id) seek(parseInt(e.target.value, 10)); else play(free); }}
                  className="player-progress flex-1"
                  style={{ ["--progress" as any]: `${pct}%` }}
                  aria-label="Progress"
                  data-testid="input-free-progress"
                />
                <span className="text-[11px] tabular-nums text-muted-foreground w-9 text-right">{formatDuration(free.durationSeconds)}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl overflow-hidden aspect-square shadow-lg relative">
              <PrayerArt prayer={free} className="absolute inset-0" rounded="rounded-none" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
        {!isUnlocked ? (
          <div className="rounded-xl border border-card-border bg-card p-7">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-brand-gold/15 p-2 text-brand-gold"><Mail className="h-4 w-4" /></div>
              <div className="flex-1">
                <h2 className="font-serif text-xl font-semibold">Enter your email to download</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  We’ll send you the audio file plus weekly Scripture encouragement. Unsubscribe anytime.
                </p>
                <form onSubmit={unlock} className="flex flex-col sm:flex-row gap-2" data-testid="form-free-unlock">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    data-testid="input-free-email"
                  />
                  <Button type="submit" disabled={submitting} className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-free-unlock">
                    {submitting ? "Unlocking…" : "Unlock download"}
                  </Button>
                </form>
                <div className="mt-4 text-xs text-muted-foreground">
                  Or <Link href="/login" className="underline hover:text-brand-gold">sign in with your account</Link>.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-brand-gold/40 bg-brand-cream/70 dark:bg-brand-gold/10 p-6 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand-gold mt-0.5" />
            <div className="flex-1">
              <div className="font-serif text-lg font-semibold">Download unlocked</div>
              <p className="text-sm text-muted-foreground mt-1">Enjoy this prayer as part of your daily rhythm.</p>
              <div className="mt-4">
                <Button data-testid="button-free-download" className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold">
                  <Download className="h-4 w-4 mr-2" /> Download (mock)
                </Button>
              </div>
            </div>
          </div>
        )}

        <Scripture reference={free.scriptures[0]}>
          {free.description}
        </Scripture>

        <div className="rounded-xl border border-card-border bg-card p-6 flex items-center justify-between gap-4">
          <div>
            <div className="font-serif text-lg font-semibold">Want more prayers?</div>
            <div className="text-sm text-muted-foreground">Browse 18+ Spirit-led prayers across 24 categories.</div>
          </div>
          <Link href="/library">
            <Button variant="outline" data-testid="button-free-browse">Explore library <ArrowRight className="h-4 w-4 ml-1.5" /></Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
