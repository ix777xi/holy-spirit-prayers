import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, Star, Trash2, MessageSquareText, LogOut, Bookmark, Lock, Crown } from "lucide-react";
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
          Sign in or create a free account to save the prayers that meet you,
          keep your history, rate them, and share what stirred your heart.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login" className="flex-1">
            <Button
              variant="outline"
              className="w-full"
              data-testid="button-account-login"
            >
              Log in
            </Button>
          </Link>
          <Link href="/register" className="flex-1">
            <Button
              className="w-full bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
              data-testid="button-account-register"
            >
              Create account
            </Button>
          </Link>
        </div>
        <div className="mt-8 text-sm">
          <Link href="/library" className="text-brand-gold hover:underline">Browse the prayer library →</Link>
        </div>
      </div>
    </PageShell>
  );
}

type Purchase = {
  id: number;
  uploadedPrayerId: number;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
};

type PurchasesResponse = {
  ok: boolean;
  items: Purchase[];
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

export default function AccountPage() {
  const { serverUser, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Record<number, { rating: number; feedback: string }>>({});

  const { data, isLoading } = useQuery<{ ok: boolean; items: UserPrayer[] }>({
    queryKey: ["/api/me/prayers"],
    enabled: !!serverUser,
  });

  const { data: purchasesData } = useQuery<PurchasesResponse>({
    queryKey: ["/api/me/purchases"],
    enabled: !!serverUser,
  });

  const { data: uploadedData } = useQuery<{
    ok: boolean;
    items: Array<{ id: number; isFree?: boolean }>;
  }>({
    queryKey: ["/api/uploaded-prayers"],
    enabled: !!serverUser,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const purchase = sp.get("purchase");
    const subscription = sp.get("subscription");
    if (purchase === "success" || subscription === "success") {
      toast({
        title: purchase === "success" ? "Prayer unlocked" : "Subscription active",
        description:
          purchase === "success"
            ? "Thank you — your prayer is ready to listen."
            : "Welcome — your subscription is active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me/prayers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/uploaded-prayers"] });
      sp.delete("purchase");
      sp.delete("subscription");
      sp.delete("session_id");
      sp.delete("prayer");
      const next = sp.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`,
      );
    }
  }, [toast]);

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
  const subscription = purchasesData?.subscription ?? null;
  const subscribed =
    !!subscription && ["active", "trialing", "past_due"].includes(subscription.status);
  const purchasedPrayerIds = new Set(
    (purchasesData?.items ?? [])
      .filter((p) => p.status === "paid")
      .map((p) => p.uploadedPrayerId),
  );

  const freePrayerIds = new Set<number>(
    (uploadedData?.items ?? [])
      .filter((p) => p.isFree)
      .map((p) => p.id),
  );
  const hasAccessToItem = (item: UserPrayer): boolean => {
    if (item.source !== "uploaded") return true;
    if (subscribed) return true;
    const idNum = Number(item.prayerKey);
    if (!Number.isFinite(idNum)) return false;
    return purchasedPrayerIds.has(idNum) || freePrayerIds.has(idNum);
  };
  const protectedAudioUrl = (item: UserPrayer): string | null => {
    if (item.source !== "uploaded") return item.audioUrl || null;
    return `/api/uploaded-prayers/${item.prayerKey}/stream`;
  };
  const protectedDownloadUrl = (item: UserPrayer): string | null => {
    if (item.source !== "uploaded") return item.audioUrl || null;
    return `/api/uploaded-prayers/${item.prayerKey}/download`;
  };

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

        <section className="mb-8" data-testid="section-account-access">
          <div
            className="rounded-xl border border-card-border bg-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            data-testid="card-account-subscription"
          >
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <div className="font-serif text-lg font-semibold">
                  {subscribed ? "Active monthly subscription" : "No active subscription"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {subscribed
                    ? subscription?.currentPeriodEnd
                      ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.`
                      : "You have unlimited access to all uploaded prayers."
                    : "Subscribe for unlimited access, or buy individual prayers for $7."}
                </div>
                <div
                  className="text-xs text-muted-foreground mt-1"
                  data-testid="text-purchase-count"
                >
                  Prayers purchased: {purchasedPrayerIds.size}
                </div>
              </div>
            </div>
            <Link
              href="/library"
              className="text-sm font-semibold text-brand-gold hover:underline self-start md:self-center"
              data-testid="link-account-browse"
            >
              Browse library →
            </Link>
          </div>
        </section>

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

                    {(() => {
                      const access = hasAccessToItem(item);
                      const audioUrl = protectedAudioUrl(item);
                      if (access && audioUrl) {
                        return (
                          <audio
                            controls
                            preload="none"
                            src={audioUrl}
                            className="w-full h-9"
                            data-testid={`audio-account-prayer-${item.id}`}
                          />
                        );
                      }
                      if (item.source === "uploaded") {
                        const idNum = Number(item.prayerKey);
                        const isFreePrayer = Number.isFinite(idNum) && freePrayerIds.has(idNum);
                        return (
                          <div
                            className="rounded-md border border-dashed border-card-border bg-background/40 px-3 py-3 text-xs text-muted-foreground flex items-center gap-2"
                            data-testid={`audio-locked-account-${item.id}`}
                          >
                            <Lock className="h-4 w-4 text-brand-gold shrink-0" />
                            {isFreePrayer
                              ? "Free prayer — refresh to load audio."
                              : "Unlock for $7 from the library, or subscribe for unlimited listening."}
                          </div>
                        );
                      }
                      return null;
                    })()}

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
                      {(() => {
                        const access = hasAccessToItem(item);
                        const url = protectedDownloadUrl(item);
                        if (!access || !url) return null;
                        return (
                          <a
                            href={url}
                            onClick={() => recordDownload.mutate(item.id)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand-gold"
                            data-testid={`link-account-download-${item.id}`}
                          >
                            <Download className="h-4 w-4" /> Download MP3
                          </a>
                        );
                      })()}
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
