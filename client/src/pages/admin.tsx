import { useState, useMemo, ReactNode, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  BookOpen,
  Tags,
  Sparkles,
  ShoppingCart,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Search,
  Download,
  Eye,
  ArrowLeft,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  UploadCloud,
  Trash2,
  Music,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/app-context";
import { Logo } from "@/components/brand/Logo";
import {
  categories,
  prayers,
  mockOrders,
  mockCustomRequests,
  mockUsers,
  revenue30d,
  popularCategories,
  userGrowth,
  formatDuration,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

/* ---------- Admin Shell ---------- */

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/prayers", label: "Prayers", icon: BookOpen },
  { href: "/admin/uploads", label: "Upload MP3", icon: UploadCloud },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  {
    href: "/admin/custom-requests",
    label: "Custom Requests",
    icon: Sparkles,
  },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
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
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card min-h-screen sticky top-0">
          <div className="p-6 border-b">
            <Link
              href="/"
              data-testid="link-admin-home"
              className="flex items-center"
            >
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
              href="/dashboard"
              data-testid="link-back-to-app"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to app
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Mobile top bar */}
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
                  <p className="text-sm text-muted-foreground mt-1">
                    {subtitle}
                  </p>
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
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div className="font-serif text-xl mt-2" data-testid={`text-kpi-value-${testId}`}>
            {value}
          </div>
          {delta && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
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

export function AdminDashboard() {
  const totalRevenue = useMemo(
    () => mockOrders.reduce((s, o) => s + o.amount, 0),
    [],
  );
  const pending = mockCustomRequests.filter((r) => r.status === "pending").length;

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Overview of your prayer marketplace performance"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Revenue (30d)"
          value={`$${totalRevenue.toLocaleString()}`}
          delta="+12.4% vs last month"
          icon={DollarSign}
          testId="revenue"
        />
        <KPICard
          label="Total Orders"
          value={String(mockOrders.length)}
          delta="+8 this week"
          icon={ShoppingCart}
          testId="orders"
        />
        <KPICard
          label="Active Users"
          value={String(mockUsers.length)}
          delta="+3 this week"
          icon={Users}
          testId="users"
        />
        <KPICard
          label="Pending Requests"
          value={String(pending)}
          icon={Sparkles}
          testId="pending"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Revenue, Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue30d}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#111111" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#111111" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#111111"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularCategories} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="#111111" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg">Recent Orders</CardTitle>
            <Link
              href="/admin/orders"
              data-testid="link-view-all-orders"
              className="text-xs text-brand-gold hover:underline"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOrders.slice(0, 5).map((o) => (
                  <TableRow key={o.id} data-testid={`row-recent-order-${o.id}`}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell className="truncate max-w-[160px]">{o.userName}</TableCell>
                    <TableCell>${o.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          o.paymentStatus === "paid"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : o.paymentStatus === "refunded"
                              ? "bg-red-500/15 text-red-700 dark:text-red-400"
                              : ""
                        }
                      >
                        {o.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg">Custom Requests</CardTitle>
            <Link
              href="/admin/custom-requests"
              data-testid="link-view-all-requests"
              className="text-xs text-brand-gold hover:underline"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCustomRequests.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                  data-testid={`row-recent-request-${r.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{r.userName}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      r.status === "pending"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : r.status === "delivered"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : ""
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

/* ---------- Prayers ---------- */

export function AdminPrayers() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const filtered = prayers.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminShell
      title="Prayers"
      subtitle={`${prayers.length} prayers in your library`}
      actions={
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy"
          data-testid="button-add-prayer"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Prayer
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search prayers..."
                className="pl-9"
                data-testid="input-search-prayers"
              />
            </div>
            <Button variant="outline" data-testid="button-export-prayers">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const cat = categories.find((c) => c.slug === p.categorySlug);
                  return (
                  <TableRow key={p.slug} data-testid={`row-prayer-${p.slug}`}>
                    <TableCell className="font-medium max-w-[260px] truncate">
                      {p.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {cat?.name || p.categorySlug}
                    </TableCell>
                    <TableCell>{formatDuration(p.durationSeconds)}</TableCell>
                    <TableCell>
                      {p.isFree ? (
                        <Badge variant="secondary" className="bg-brand-blue/15 text-brand-blue">
                          Free
                        </Badge>
                      ) : (
                        `$${p.price}`
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        Published
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/prayer/${p.slug}`}
                        data-testid={`link-view-prayer-${p.slug}`}
                      >
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Add New Prayer</DialogTitle>
            <DialogDescription>
              Create a new prayer for the marketplace. Audio upload is stubbed in this prototype.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="np-title">Title</Label>
              <Input id="np-title" placeholder="Morning Surrender" data-testid="input-new-prayer-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="np-cat">Category</Label>
                <Select>
                  <SelectTrigger id="np-cat" data-testid="select-new-prayer-category">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(0, 10).map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="np-price">Price</Label>
                <Input id="np-price" type="number" defaultValue="7" data-testid="input-new-prayer-price" />
              </div>
            </div>
            <div>
              <Label htmlFor="np-desc">Description</Label>
              <Textarea id="np-desc" rows={3} data-testid="input-new-prayer-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} data-testid="button-cancel-add-prayer">
              Cancel
            </Button>
            <Button
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy"
              onClick={() => {
                toast({ title: "Prayer added", description: "Prayer queued for audio processing." });
                setShowAdd(false);
              }}
              data-testid="button-save-new-prayer"
            >
              Save Prayer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

/* ---------- Categories ---------- */

export function AdminCategories() {
  return (
    <AdminShell
      title="Categories"
      subtitle={`${categories.length} prayer categories`}
      actions={
        <Button
          className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy"
          data-testid="button-add-category"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => {
          const count = prayers.filter((p) => p.categorySlug === c.slug).length;
          return (
            <Card key={c.slug} className="hover-elevate transition-all" data-testid={`card-category-${c.slug}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-serif text-base">{c.name}</h3>
                  <Badge variant="secondary">{count} prayers</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}

/* ---------- Custom Requests ---------- */

export function AdminCustomRequests() {
  const [requests, setRequests] = useState(mockCustomRequests);
  const [selected, setSelected] = useState<typeof mockCustomRequests[0] | null>(null);
  const { toast } = useToast();

  const updateStatus = (id: string, status: typeof mockCustomRequests[0]["status"]) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    toast({ title: "Status updated", description: `${id} → ${status}` });
  };

  return (
    <AdminShell
      title="Custom Prayer Requests"
      subtitle="Personalized prayer commissions from customers"
    >
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Theme</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id} data-testid={`row-custom-request-${r.id}`}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="text-sm">{r.userName}</TableCell>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{r.description}</TableCell>
                    <TableCell>
                      <Select
                        value={r.status}
                        onValueChange={(v) => updateStatus(r.id, v as any)}
                      >
                        <SelectTrigger className="h-8 w-[130px]" data-testid={`select-status-${r.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelected(r)}
                        data-testid={`button-view-request-${r.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Request {selected?.id}
            </DialogTitle>
            <DialogDescription>From {selected?.userName}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">From</div>
                <div>{selected.userName} &lt;{selected.email}&gt;</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Category</div>
                <div>{categories.find((c) => c.slug === selected.categorySlug)?.name || selected.categorySlug}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Tone</div>
                <div className="flex flex-wrap gap-1">
                  {selected.preferredTone.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Description</div>
                <p className="text-muted-foreground italic">"{selected.description}"</p>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Audio requested</span>
                <span className="font-medium">{selected.wantAudio ? "Yes" : "No"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)} data-testid="button-close-request">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

/* ---------- Orders ---------- */

export function AdminOrders() {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? mockOrders : mockOrders.filter((o) => o.paymentStatus === filter);

  return (
    <AdminShell
      title="Orders"
      subtitle={`${mockOrders.length} total orders`}
      actions={
        <Button variant="outline" data-testid="button-export-orders">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-order-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All orders</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => {
                  const pp = prayers.find((pr) => pr.slug === o.prayerSlug);
                  return (
                  <TableRow key={o.id} data-testid={`row-order-${o.id}`}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell>{o.userName}</TableCell>
                    <TableCell className="text-sm max-w-[220px] truncate">{pp?.title || o.prayerSlug}</TableCell>
                    <TableCell className="text-xs uppercase tracking-widest text-muted-foreground">
                      {o.downloadStatus}
                    </TableCell>
                    <TableCell>${o.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          o.paymentStatus === "paid"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : o.paymentStatus === "refunded"
                              ? "bg-red-500/15 text-red-700 dark:text-red-400"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }
                      >
                        {o.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.date.slice(0, 10)}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

/* ---------- Users ---------- */

export function AdminUsers() {
  return (
    <AdminShell title="Users" subtitle={`${mockUsers.length} registered users`}>
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((u) => (
                <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        u.role === "admin"
                          ? "bg-brand-gold/15 text-brand-gold"
                          : ""
                      }
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.totalPurchases}</TableCell>
                  <TableCell>${u.totalPurchases * 7}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.joined}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

/* ---------- Analytics ---------- */

export function AdminAnalytics() {
  return (
    <AdminShell title="Analytics" subtitle="Performance metrics and trends">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">User Growth (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#6B7280"
                    strokeWidth={2}
                    dot={{ fill: "#6B7280", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Top Categories by Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="#111111" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Revenue Detail</CardTitle>
            <CardDescription>Daily revenue across the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue30d}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#111111" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
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
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="prayer-price">Standard Prayer Price</Label>
                  <Input id="prayer-price" type="number" defaultValue="7" data-testid="input-prayer-price" />
                </div>
                <div>
                  <Label htmlFor="custom-price">Custom Prayer Price</Label>
                  <Input id="custom-price" type="number" defaultValue="10" data-testid="input-custom-price" />
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
              <CardDescription>Connect Stripe, email, and storage providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Stripe", desc: "Payment processing", status: "Configure via STRIPE_SECRET_KEY" },
                { name: "Resend", desc: "Transactional email", status: "Configure via RESEND_API_KEY" },
                { name: "AWS S3", desc: "Audio file storage", status: "Configure via S3_* env vars" },
                { name: "Google OAuth", desc: "Social login", status: "Configure via GOOGLE_CLIENT_ID" },
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

/* ---------- Uploads (MP3 prayers) ---------- */

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
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [categorySlug, setCategorySlug] = useState<string>(categories[0]?.slug || "");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const reset = () => {
    setTitle("");
    setCategorySlug(categories[0]?.slug || "");
    setDescription("");
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

  return (
    <AdminShell
      title="Upload MP3 Prayers"
      subtitle="Add an audio prayer with category, title, and description. It will appear in the public Prayer Library."
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2" data-testid="card-upload-form">
          <CardHeader>
            <CardTitle className="font-serif text-lg">New audio prayer</CardTitle>
            <CardDescription>MP3 only. Max 50&nbsp;MB.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4" data-testid="form-upload-prayer">
              <div>
                <Label htmlFor="up-title">Title</Label>
                <Input
                  id="up-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Evening Surrender"
                  required
                  data-testid="input-upload-title"
                />
              </div>
              <div>
                <Label htmlFor="up-cat">Category</Label>
                <Select value={categorySlug} onValueChange={setCategorySlug}>
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
                <Label htmlFor="up-desc">Description</Label>
                <Textarea
                  id="up-desc"
                  rows={4}
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
                  <UploadCloud className="h-4 w-4 mr-2" />
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

        <Card className="lg:col-span-3" data-testid="card-uploaded-list">
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
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4 text-foreground/70" />
                            <div className="font-medium truncate" data-testid={`text-uploaded-title-${it.id}`}>
                              {it.title}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {cat?.name || it.categorySlug} · {formatBytes(it.audioSize)}
                          </div>
                          {it.description ? (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.description}</p>
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
