import { useState } from "react";
import { Link } from "wouter";
import { Bookmark, Headphones, MessageSquare, Settings, Download, Trash2, Heart } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { Button } from "@/components/ui/button";
import { PrayerCard } from "@/components/brand/PrayerCard";
import { PrayerArt } from "@/components/brand/PrayerArt";
import { useAuth, usePlayer } from "@/lib/app-context";
import { prayers, demoUser, formatDuration } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

type Tab = "prayers" | "requests" | "favorites" | "settings";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("prayers");
  const { user, signIn } = useAuth();
  const { ownedSlugs, favorites, toggleFavorite } = usePlayer();
  const { toast } = useToast();

  // Auto-fill demo user if not signed in for easier preview
  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="headline text-3xl mb-3">Sign in to access your dashboard</h1>
          <p className="text-muted-foreground mb-6">
            Your purchased prayers, custom requests, and favorites live here.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/login"><Button variant="outline" data-testid="button-dashboard-login">Log in</Button></Link>
            <Button
              onClick={() => signIn(demoUser.email)}
              className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
              data-testid="button-dashboard-demo"
            >
              Continue as demo user
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const ownedPrayers = prayers.filter((p) => ownedSlugs.has(p.slug));
  const favPrayers = prayers.filter((p) => favorites.has(p.slug));

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-2">Welcome back</div>
            <h1 className="headline text-3xl md:text-4xl" data-testid="text-dashboard-greet">Peace be with you, {user.name}.</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-8 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 min-w-max">
            {[
              { id: "prayers", label: "My Prayers", icon: Headphones },
              { id: "requests", label: "Custom Requests", icon: MessageSquare },
              { id: "favorites", label: "Favorites", icon: Bookmark },
              { id: "settings", label: "Account Settings", icon: Settings },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  data-testid={`tab-${t.id}`}
                  className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium hover-elevate rounded-t-md ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {active && <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-brand-gold rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "prayers" && (
          <section>
            {ownedPrayers.length === 0 ? (
              <Empty
                title="You haven’t purchased any prayers yet"
                desc="Explore the library and find a prayer that meets you where you are."
                ctaHref="/library"
                cta="Browse library"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {ownedPrayers.map((p) => (
                  <div key={p.id} className="rounded-xl border border-card-border bg-card overflow-hidden">
                    <div className="relative aspect-[16/10]">
                      <PrayerArt prayer={p} className="absolute inset-0" rounded="rounded-none" />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="text-xs text-muted-foreground">Purchased {demoUser.purchaseDates[p.slug] ?? "—"}</div>
                      <h3 className="font-serif text-lg font-semibold leading-snug">{p.title}</h3>
                      <div className="text-xs text-muted-foreground">{formatDuration(p.durationSeconds)}</div>
                      <div className="flex items-center justify-between pt-2">
                        <Link href={`/prayer/${p.slug}`} className="text-sm hover:text-brand-gold">View</Link>
                        <Button
                          size="sm"
                          className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
                          onClick={() => toast({ title: "Downloading…", description: `${p.title} (mock)` })}
                          data-testid={`button-download-${p.slug}`}
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "requests" && (
          <section>
            <div className="rounded-xl border border-card-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Request ID</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demoUser.customRequests.map((r) => (
                    <tr key={r.id} className="border-t border-border" data-testid={`row-request-${r.id}`}>
                      <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                      <td className="px-4 py-3">{r.category}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{r.date}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {["delivered", "completed"].includes(r.status) ? (
                          <Button size="sm" variant="outline" data-testid={`button-listen-${r.id}`}>Listen</Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">In progress…</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "favorites" && (
          <section>
            {favPrayers.length === 0 ? (
              <Empty
                title="No favorites yet"
                desc="Tap the heart on any prayer to save it for later."
                ctaHref="/library"
                cta="Browse library"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {favPrayers.map((p) => (
                  <div key={p.id} className="relative">
                    <PrayerCard prayer={p} />
                    <button
                      onClick={() => toggleFavorite(p.slug)}
                      className="absolute -top-2 -right-2 z-10 rounded-full bg-card border border-border p-1.5 shadow-sm hover-elevate"
                      aria-label="Remove from favorites"
                      data-testid={`button-unfav-${p.slug}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "settings" && (
          <section className="max-w-2xl space-y-8">
            <div className="rounded-xl border border-card-border bg-card p-6 space-y-4">
              <div>
                <h3 className="font-serif text-lg font-semibold mb-1">Profile</h3>
                <p className="text-sm text-muted-foreground">Your display name and email.</p>
              </div>
              <SettingsField label="Name" defaultValue={user.name} />
              <SettingsField label="Email" defaultValue={user.email} />
              <Button onClick={() => toast({ title: "Saved (mock)" })} data-testid="button-save-profile">Save changes</Button>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6 space-y-4">
              <div>
                <h3 className="font-serif text-lg font-semibold mb-1">Password</h3>
                <p className="text-sm text-muted-foreground">Change your password regularly.</p>
              </div>
              <SettingsField label="Current password" type="password" />
              <SettingsField label="New password" type="password" />
              <Button variant="outline" onClick={() => toast({ title: "Password updated (mock)" })} data-testid="button-change-password">Change password</Button>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
              <h3 className="font-serif text-lg font-semibold text-destructive mb-1">Delete account</h3>
              <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and data. This cannot be undone.</p>
              <Button variant="destructive" onClick={() => toast({ title: "Account deletion requested (mock)" })} data-testid="button-delete-account">Delete account</Button>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function Empty({ title, desc, ctaHref, cta }: { title: string; desc: string; ctaHref: string; cta: string }) {
  return (
    <div className="rounded-xl border border-dashed border-card-border bg-card p-14 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/15 text-brand-gold mb-4">
        <Heart className="h-5 w-5" />
      </div>
      <h3 className="font-serif text-xl font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">{desc}</p>
      <Link href={ctaHref}><Button variant="outline">{cta}</Button></Link>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "in_progress" | "completed" | "delivered" }) {
  const styles: Record<typeof status, string> = {
    pending: "bg-muted text-foreground/80",
    in_progress: "bg-brand-blue/20 text-brand-navy dark:text-brand-blue",
    completed: "bg-brand-gold/20 text-brand-navy dark:text-brand-gold",
    delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  };
  const labels: Record<typeof status, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    delivered: "Delivered",
  };
  return <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${styles[status]}`}>{labels[status]}</span>;
}

function SettingsField({ label, type = "text", defaultValue = "" }: { label: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
      />
    </div>
  );
}
