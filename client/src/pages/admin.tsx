import { useState, ReactNode, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  UploadCloud,
  Settings as SettingsIcon,
  Sparkles,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  TrendingUp,
  UploadCloud as UploadIcon,
  Trash2,
  Music,
  ShieldCheck,
  LogOut,
  Loader2,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/app-context";
import { Logo } from "@/components/brand/Logo";
import { categories, formatDuration } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

/* ---------- Admin Shell ---------- */

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/uploads", label: "Upload Prayer", icon: UploadCloud },
  { href: "/admin/custom-requests", label: "Custom Requests", icon: Sparkles },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

function AdminShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-brand-cream/30 dark:bg-brand-navy/40">
      <div className="flex">
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card min-h-screen sticky top-0">
          <div className="p-6 border-b">
            <Link href="/" data-testid="link-admin-home" className="flex items-center">
              <Logo size="md" />
            </Link>
            <div className="mt-2 text-xs uppercase tracking-widest text-brand-gold font-semibold">
              Admin Console
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location === item.href
                : location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-brand-gold/15 text-brand-gold font-medium"
                      : "hover:bg-muted text-foreground/80"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <Link
              href="/account"
              data-testid="link-back-to-app"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to app
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="lg:hidden border-b bg-card sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <Link href="/" data-testid="link-mobile-home">
                <Logo size="sm" />
              </Link>
              <Badge variant="secondary" className="bg-brand-gold/15 text-brand-gold border-brand-gold/30">
                Admin
              </Badge>
            </div>
            <div className="px-4 pb-3 overflow-x-auto">
              <div className="flex gap-1">
                {navItems.map((item) => {
                  const isActive = item.exact
                    ? location === item.href
                    : location.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-testid={`link-mobile-admin-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-md ${
                        isActive
                          ? "bg-brand-gold/15 text-brand-gold font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
            <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <h1
                  className="font-serif text-xl lg:text-2xl text-foreground"
                  data-testid="text-admin-title"
                >
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {actions}
                {user && (
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium" data-testid="text-admin-user-name">
                      {user.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                )}
              </div>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

const KPICard = ({
  label,
  value,
  delta,
  icon: Icon,
  testId,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: any;
  testId: string;
}) => (
  <Card data-testid={`card-kpi-${testId}`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-serif text-xl mt-2" data-testid={`text-kpi-value-${testId}`}>
            {value}
          </div>
          {delta && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {delta}
            </div>
          )}
        </div>
        <div className="h-10 w-10 rounded-md bg-brand-gold/15 text-brand-gold flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

type DashboardSummary = {
  ok: boolean;
  uploadedPrayers: number;
  newsletterSignups: number;
  contactSubmissions: number;
  customPrayerRequests: number;
};

export function AdminDashboard() {
  const { data } = useQuery<DashboardSummary>({ queryKey: ["/api/admin/dashboard"] });

  return (
    <AdminShell title="Dashboard" subtitle="Overview of your prayer marketplace">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Uploaded Prayers"
          value={String(data?.uploadedPrayers ?? 0)}
          icon={Music}
          testId="uploaded"
        />
        <KPICard
          label="Newsletter Signups"
          value={String(data?.newsletterSignups ?? 0)}
          icon={Users}
          testId="newsletter"
        />
        <KPICard
          label="Contact Messages"
          value={String(data?.contactSubmissions ?? 0)}
          icon={ShoppingCart}
          testId="contact"
        />
        <KPICard
          label="Custom Requests"
          value={String(data?.customPrayerRequests ?? 0)}
          icon={Sparkles}
          testId="custom"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Quick start</CardTitle>
          <CardDescription>
            Upload a Spirit-led prayer with structured Bible theme, scripture, and notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin/uploads">
            <Button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy" data-testid="button-go-uploads">
              <Plus className="h-4 w-4 mr-2" /> Upload a prayer
            </Button>
          </Link>
          <Link href="/admin/custom-requests">
            <Button variant="outline" data-testid="button-go-custom-requests">
              View custom requests
            </Button>
          </Link>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

/* ---------- Custom Requests (read-only, server intake) ---------- */

export function AdminCustomRequests() {
  return (
    <AdminShell
      title="Custom Prayer Requests"
      subtitle="Personalized prayer commissions from customers"
    >
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Incoming custom prayer requests are emailed to the site owner and stored in the
          server&apos;s in-memory queue. Connect a CRM or persistent store to manage them here.
        </CardContent>
      </Card>
    </AdminShell>
  );
}

/* ---------- Settings ---------- */

export function AdminSettings() {
  const { toast } = useToast();
  return (
    <AdminShell title="Settings" subtitle="Configure your marketplace">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" data-testid="tab-settings-general">General</TabsTrigger>
          <TabsTrigger value="pricing" data-testid="tab-settings-pricing">Pricing</TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-settings-integrations">Integrations</TabsTrigger>
          <TabsTrigger value="email" data-testid="tab-settings-email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Site Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div>
                <Label htmlFor="site-title">Site Title</Label>
                <Input id="site-title" defaultValue="Holy Spirit Prayers" data-testid="input-site-title" />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" defaultValue="Bible-centered prayers, in your moment of need" data-testid="input-tagline" />
              </div>
              <div className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <Label htmlFor="maintenance">Maintenance mode</Label>
                  <p className="text-xs text-muted-foreground">Temporarily disable the public storefront</p>
                </div>
                <Switch id="maintenance" data-testid="switch-maintenance-mode" />
              </div>
              <Button
                onClick={() => toast({ title: "Settings saved" })}
                className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy"
                data-testid="button-save-settings"
              >
                Save changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Pricing</CardTitle>
              <CardDescription>
                $7 per prayer, $27/month subscription. Promotion code 777 grants 100% off the
                monthly subscription. Set the live values via Stripe Dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="prayer-price">Prayer Price (USD)</Label>
                  <Input id="prayer-price" type="number" defaultValue="7" data-testid="input-prayer-price" />
                </div>
                <div>
                  <Label htmlFor="sub-price">Subscription / month (USD)</Label>
                  <Input id="sub-price" type="number" defaultValue="27" data-testid="input-sub-price" />
                </div>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger id="currency" data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Integrations</CardTitle>
              <CardDescription>Stripe, email, storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Stripe", desc: "Payment processing + promo codes (777)", status: "Configure via STRIPE_SECRET_KEY" },
                { name: "Resend", desc: "Transactional email", status: "Configure via RESEND_API_KEY" },
                { name: "AWS S3", desc: "Audio file storage", status: "Configure via S3_* env vars" },
              ].map((i) => (
                <div
                  key={i.name}
                  className="flex items-center justify-between border rounded-md p-4"
                  data-testid={`integration-${i.name.toLowerCase()}`}
                >
                  <div>
                    <div className="font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground">{i.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Email Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Welcome email",
                "Order confirmation",
                "Custom prayer delivery",
                "Password reset",
                "Newsletter weekly",
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-center justify-between border rounded-md p-3"
                  data-testid={`email-template-${t.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">{t}</span>
                  </div>
                  <Button size="sm" variant="ghost">Edit</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

/* ---------- Admin auth ---------- */

type AdminIdentity = { username: string } | null;

function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminIdentity>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/me", { credentials: "include" });
      if (!res.ok) {
        setAdmin(null);
        return;
      }
      const json = (await res.json()) as { ok: boolean; admin: AdminIdentity };
      setAdmin(json.admin ?? null);
    } catch {
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || "Login failed");
    }
    setAdmin(json.admin ?? null);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    setAdmin(null);
  }, []);

  return { admin, loading, login, logout, refresh };
}

function AdminLoginGate({
  loading,
  onLogin,
}: {
  loading: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-brand-cream/30 dark:bg-brand-navy/40"
        data-testid="admin-login-loading"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking admin session…
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-brand-cream/30 dark:bg-brand-navy/40 px-4 py-10"
      data-testid="admin-login-page"
    >
      <Card className="w-full max-w-md" data-testid="admin-login-card">
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-gold">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs uppercase tracking-widest font-semibold">Admin Console</span>
          </div>
          <CardTitle className="font-serif text-xl mt-2">Sign in to upload prayers</CardTitle>
          <CardDescription>
            This area is restricted. Use the admin credentials provided by the site owner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" data-testid="admin-login-form">
            <div>
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                data-testid="input-admin-username"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                data-testid="input-admin-password"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400" data-testid="text-admin-login-error" role="alert">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-navy"
              data-testid="button-admin-login"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Uploads ---------- */

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
  audioUrl: string;
  audioOriginalName: string;
  audioMimeType: string;
  audioSize: number;
  durationSeconds: number;
  createdAt: string;
};

function formatBytes(n: number) {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function AdminUploads() {
  const { admin, loading, login, logout } = useAdminAuth();

  if (!admin) {
    return <AdminLoginGate loading={loading} onLogin={login} />;
  }

  return <AdminUploadsAuthenticated adminUsername={admin.username} onLogout={logout} />;
}

function AdminUploadsAuthenticated({
  adminUsername,
  onLogout,
}: {
  adminUsername: string;
  onLogout: () => Promise<void>;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const initialCategorySlug = categories[0]?.slug || "";
  const initialCategoryDescription = categories[0]?.description || "";

  const [title, setTitle] = useState("");
  const [categorySlug, setCategorySlug] = useState<string>(initialCategorySlug);
  const [categoryDescription, setCategoryDescription] = useState<string>(initialCategoryDescription);
  const [description, setDescription] = useState("");
  const [bibleTheme, setBibleTheme] = useState("");
  const [supportingScripture, setSupportingScripture] = useState("");
  const [aboutPrayer, setAboutPrayer] = useState("");
  const [whatsIncluded, setWhatsIncluded] = useState("");
  const [scriptureQuote, setScriptureQuote] = useState("");
  const [scriptureReference, setScriptureReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { data, isLoading } = useQuery<{ ok: boolean; items: UploadedPrayerItem[] }>({
    queryKey: ["/api/uploaded-prayers"],
  });

  const items = data?.items ?? [];

  const removeMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/uploaded-prayers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/uploaded-prayers"] });
      toast({ title: "Prayer removed" });
    },
    onError: (e: any) => toast({ title: "Could not remove", description: e?.message || "", variant: "destructive" }),
  });

  function handleCategoryChange(slug: string) {
    setCategorySlug(slug);
    const next = categories.find((c) => c.slug === slug);
    if (next) setCategoryDescription(next.description);
  }

  const reset = () => {
    setTitle("");
    setCategorySlug(initialCategorySlug);
    setCategoryDescription(initialCategoryDescription);
    setDescription("");
    setBibleTheme("");
    setSupportingScripture("");
    setAboutPrayer("");
    setWhatsIncluded("");
    setScriptureQuote("");
    setScriptureReference("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Select an MP3 file first", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("categorySlug", categorySlug);
      fd.append("description", description.trim());
      fd.append("bibleTheme", bibleTheme.trim());
      fd.append("supportingScripture", supportingScripture.trim());
      fd.append("aboutPrayer", aboutPrayer.trim());
      fd.append("whatsIncluded", whatsIncluded.trim());
      fd.append("scriptureQuote", scriptureQuote.trim());
      fd.append("scriptureReference", scriptureReference.trim());
      fd.append("categoryDescription", categoryDescription.trim());
      fd.append("audio", file);
      const res = await fetch("/api/uploaded-prayers", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Upload failed");
      toast({ title: "Prayer uploaded", description: "Now available in the Prayer Library." });
      reset();
      qc.invalidateQueries({ queryKey: ["/api/uploaded-prayers"] });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <AdminShell
      title="Upload MP3 Prayers"
      subtitle="Add a Spirit-led prayer with its Bible theme, scripture, and notes."
      actions={
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-brand-gold/15 text-brand-gold border-brand-gold/30"
            data-testid="text-admin-username"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            {adminUsername}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {loggingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3" data-testid="card-upload-form">
          <CardHeader>
            <CardTitle className="font-serif text-lg">New audio prayer</CardTitle>
            <CardDescription>MP3 only. Max 50&nbsp;MB. All structured fields are saved with the prayer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4" data-testid="form-upload-prayer">
              <div>
                <Label htmlFor="up-title">Title</Label>
                <Input
                  id="up-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Morning Surrender — Let the Spirit Lead"
                  required
                  data-testid="input-upload-title"
                />
              </div>

              <div>
                <Label htmlFor="up-bible-theme">Bible Theme</Label>
                <Textarea
                  id="up-bible-theme"
                  rows={2}
                  value={bibleTheme}
                  onChange={(e) => setBibleTheme(e.target.value)}
                  placeholder="e.g. Beginning the day yielded, listening, and ready."
                  data-testid="input-upload-bible-theme"
                />
              </div>

              <div>
                <Label htmlFor="up-supporting-scripture">Supporting Scripture</Label>
                <Textarea
                  id="up-supporting-scripture"
                  rows={3}
                  value={supportingScripture}
                  onChange={(e) => setSupportingScripture(e.target.value)}
                  placeholder={`Lamentations 3:22–23\nRomans 8:14\nPsalm 5:3`}
                  data-testid="input-upload-supporting-scripture"
                />
                <p className="text-xs text-muted-foreground mt-1">One reference per line.</p>
              </div>

              <div>
                <Label htmlFor="up-about">About this prayer</Label>
                <Textarea
                  id="up-about"
                  rows={3}
                  value={aboutPrayer}
                  onChange={(e) => setAboutPrayer(e.target.value)}
                  placeholder="e.g. Open your morning with stillness…"
                  data-testid="input-upload-about-prayer"
                />
              </div>

              <div>
                <Label htmlFor="up-included">What’s included</Label>
                <Textarea
                  id="up-included"
                  rows={3}
                  value={whatsIncluded}
                  onChange={(e) => setWhatsIncluded(e.target.value)}
                  placeholder={`Full audio prayer (8 min)\nWritten transcript\n7-day morning rhythm`}
                  data-testid="input-upload-whats-included"
                />
                <p className="text-xs text-muted-foreground mt-1">One bullet per line.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="up-quote">Scripture Quote</Label>
                  <Textarea
                    id="up-quote"
                    rows={3}
                    value={scriptureQuote}
                    onChange={(e) => setScriptureQuote(e.target.value)}
                    placeholder="e.g. “Likewise the Spirit also helps…”"
                    data-testid="input-upload-scripture-quote"
                  />
                </div>
                <div>
                  <Label htmlFor="up-quote-ref">Scripture Reference</Label>
                  <Input
                    id="up-quote-ref"
                    value={scriptureReference}
                    onChange={(e) => setScriptureReference(e.target.value)}
                    placeholder="e.g. ROMANS 8:26"
                    data-testid="input-upload-scripture-reference"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="up-cat">Category</Label>
                  <Select value={categorySlug} onValueChange={handleCategoryChange}>
                    <SelectTrigger id="up-cat" data-testid="select-upload-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="up-cat-desc">Category description</Label>
                  <Input
                    id="up-cat-desc"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="e.g. Starting the day with surrender and purpose."
                    data-testid="input-upload-category-description"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="up-desc">Short description (used on cards)</Label>
                <Textarea
                  id="up-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description of this prayer."
                  data-testid="input-upload-description"
                />
              </div>

              <div>
                <Label htmlFor="up-file">MP3 file</Label>
                <input
                  ref={fileRef}
                  id="up-file"
                  type="file"
                  accept="audio/mpeg,audio/mp3,.mp3"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm mt-2 file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:text-background file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-foreground/90"
                  data-testid="input-upload-file"
                />
                {file ? (
                  <div className="text-xs text-muted-foreground mt-2" data-testid="text-upload-file-info">
                    {file.name} · {formatBytes(file.size)}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-foreground text-background hover:bg-foreground/90"
                  data-testid="button-upload-submit"
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  {submitting ? "Uploading…" : "Upload prayer"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={reset}
                  disabled={submitting}
                  data-testid="button-upload-reset"
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-uploaded-list">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Uploaded prayers</CardTitle>
            <CardDescription>
              {isLoading ? "Loading…" : `${items.length} uploaded ${items.length === 1 ? "prayer" : "prayers"}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 && !isLoading ? (
              <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
                No uploads yet. Add one with the form to the left.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => {
                  const cat = categories.find((c) => c.slug === it.categorySlug);
                  return (
                    <div
                      key={it.id}
                      className="border rounded-md p-3 flex flex-col gap-2"
                      data-testid={`row-uploaded-prayer-${it.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4 text-foreground/70" />
                            <div className="font-medium truncate" data-testid={`text-uploaded-title-${it.id}`}>
                              {it.title}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {cat?.name || it.categorySlug} · {formatBytes(it.audioSize)}
                            {it.durationSeconds ? ` · ${formatDuration(it.durationSeconds)}` : ""}
                          </div>
                          {it.bibleTheme ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              <span className="uppercase tracking-wider text-[10px] text-brand-gold mr-1">Theme:</span>
                              <span className="italic line-clamp-1">{it.bibleTheme}</span>
                            </div>
                          ) : null}
                          {it.supportingScripture ? (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              <span className="uppercase tracking-wider text-[10px] text-brand-gold mr-1">Scripture:</span>
                              {it.supportingScripture.replace(/\r?\n/g, " · ")}
                            </div>
                          ) : null}
                          {it.scriptureReference ? (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              <span className="uppercase tracking-wider text-[10px] text-brand-gold mr-1">Quote ref:</span>
                              {it.scriptureReference}
                            </div>
                          ) : null}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete "${it.title}"?`)) removeMut.mutate(it.id);
                          }}
                          data-testid={`button-delete-uploaded-${it.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <audio
                        controls
                        src={it.audioUrl}
                        preload="none"
                        className="w-full h-9"
                        data-testid={`audio-uploaded-${it.id}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

