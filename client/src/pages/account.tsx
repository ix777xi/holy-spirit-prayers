import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, Star, Trash2, MessageSquareText, LogOut, Bookmark } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/app-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type UserPrayer = {
  id: number;
  source: "seed" | "uploaded";
  prayerKey: string;
  title: string;
  categorySlug: string;
  description: string;
  audioUrl: string;
  rating: number;
  feedback: string;
  selectedAt: string;
  downloadedAt: string | null;
  downloadCount: number;
};

function GoogleSignInButton({ label }: { label: string }) {
  return (
    <a
      href="/api/auth/google/start"
      className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm font-medium hover-elevate flex items-center justify-center gap-3"
      data-testid="button-google-signin"
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-5.9 8-11.3 8a12 12 0 1 1 0-24 12 12 0 0 1 8.5 3.5l5.7-5.7A20 20 0 0 0 24 4a20 20 0 0 0 0 40c10 0 19-7.3 19-20 0-1.4-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 8.5 3.5l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 13.9-5.5l-6.4-5.4A12 12 0 0 1 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.4 5.4C41.4 36 44 31 44 25c0-1.6-.2-3-.4-4.5z" />
      </svg>
      {label}
    </a>
  );
}

function StarRating({ value, onChange, testId }: { value: number; onChange: (v: number) => void; testId: string }) {
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rate this prayer">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(value === n ? 0 : n)}
            className="hover-elevate rounded-md p-1"
            data-testid={`${testId}-${n}`}
          >
            <Star
              className={`h-5 w-5 ${active ? "fill-brand-gold text-brand-gold" : "text-muted-foreground"}`}
            />
          </button>
        );
      })}
    </div>
  );
}

function SignedOutPrompt() {
  return (
    <PageShell>
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="flex justify-center mb-5"><LogoMark size={56} /></div>
        <h1 className="headline text-3xl mb-2" data-testid="text-account-signin-title">Welcome, friend.</h1>
        <p className="text-muted-foreground mb-8">
          Sign in with Google to save the prayers that meet you, keep your history,
          rate them, and share what stirred your heart.
        </p>
        <div className="space-y-3">
          <GoogleSignInButton label="Continue with Google" />
          <p className="text-xs text-muted-foreground">
            We use Google sign-in only to identify your account.
          </p>
        </div>
        <div className="mt-8 text-sm">
          <Link href="/library" className="text-brand-gold hover:underline">Browse the prayer library →</Link>
        </div>
      </div>
    </PageShell>
  );
}

export default function AccountPage() {
  const { serverUser, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Record<number, { rating: number; feedback: string }>>({});

  const { data, isLoading } = useQuery<{ ok: boolean; items: UserPrayer[] }>({
    queryKey: ["/api/me/prayers"],
    enabled: !!serverUser,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, rating, feedback }: { id: number; rating?: number; feedback?: string }) => {
      const body: Record<string, unknown> = {};
      if (rating !== undefined) body.rating = rating;
      if (feedback !== undefined) body.feedback = feedback;
      const res = await apiRequest("PATCH", `/api/me/prayers/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/prayers"] });
      toast({ title: "Saved", description: "Your feedback was recorded." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const recordDownload = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/me/prayers/${id}/download`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/prayers"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/me/prayers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/prayers"] });
      toast({ title: "Removed", description: "Prayer removed from your account." });
    },
  });

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-6 py-24 text-center text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }

  if (!serverUser) return <SignedOutPrompt />;

  const items = data?.items ?? [];

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 md:px-6 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-2">Your Account</div>
            <h1 className="headline text-3xl md:text-4xl" data-testid="text-account-greet">
              Peace be with you, {serverUser.name || serverUser.email}.
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Signed in as <span data-testid="text-account-email">{serverUser.email}</span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={signOut}
            data-testid="button-account-signout"
            className="self-start"
          >
            <LogOut className="h-4 w-4 mr-1.5" /> Sign out
          </Button>
        </div>

        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-xl md:text-2xl flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-brand-gold" /> My Selected Prayers
            </h2>
            <Link href="/library" className="text-sm text-brand-gold hover:underline">
              Add more from the library →
            </Link>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading your prayers…</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-card-border bg-card p-12 text-center">
              <h3 className="font-serif text-xl font-semibold mb-1">No prayers saved yet</h3>
              <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
                Tap “Save to my account” on any prayer in the library to keep it here.
              </p>
              <Link href="/library">
                <Button className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold">
                  Browse library
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const draft = editing[item.id] ?? { rating: item.rating, feedback: item.feedback };
                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-card-border bg-card p-5 space-y-4"
                    data-testid={`card-account-prayer-${item.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wider text-foreground/70">
                          {item.categorySlug || item.source}
                        </div>
                        <h3
                          className="font-serif text-lg leading-snug font-semibold tracking-tight mt-0.5"
                          data-testid={`text-account-prayer-title-${item.id}`}
                        >
                          {item.title}
                        </h3>
                        {item.description ? (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        ) : null}
                      </div>
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        className="hover-elevate rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                        aria-label="Remove from account"
                        data-testid={`button-remove-prayer-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {item.audioUrl ? (
                      <audio
                        controls
                        preload="none"
                        src={item.audioUrl}
                        className="w-full h-9"
                        data-testid={`audio-account-prayer-${item.id}`}
                      />
                    ) : null}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <div>
                        Saved: {new Date(item.selectedAt).toLocaleString()}
                      </div>
                      <div data-testid={`text-download-count-${item.id}`}>
                        Downloads: {item.downloadCount}
                        {item.downloadedAt ? ` · last ${new Date(item.downloadedAt).toLocaleDateString()}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">Rating</span>
                        <StarRating
                          value={draft.rating}
                          onChange={(v) => {
                            setEditing((s) => ({ ...s, [item.id]: { ...draft, rating: v } }));
                            updateMutation.mutate({ id: item.id, rating: v });
                          }}
                          testId={`rating-${item.id}`}
                        />
                      </div>
                      {item.audioUrl ? (
                        <a
                          href={item.audioUrl}
                          download
                          onClick={() => recordDownload.mutate(item.id)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand-gold"
                          data-testid={`link-account-download-${item.id}`}
                        >
                          <Download className="h-4 w-4" /> Download MP3
                        </a>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor={`feedback-${item.id}`}
                        className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5"
                      >
                        <MessageSquareText className="h-3.5 w-3.5" /> Feedback
                      </label>
                      <textarea
                        id={`feedback-${item.id}`}
                        rows={3}
                        value={draft.feedback}
                        placeholder="What did this prayer stir in you?"
                        onChange={(e) =>
                          setEditing((s) => ({ ...s, [item.id]: { ...draft, feedback: e.target.value } }))
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        data-testid={`input-feedback-${item.id}`}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMutation.mutate({ id: item.id, feedback: draft.feedback })
                          }
                          data-testid={`button-save-feedback-${item.id}`}
                        >
                          Save feedback
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
