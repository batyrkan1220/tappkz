import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Store, Users, ShoppingCart, Package, DollarSign, UserCheck, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight, Eye } from "lucide-react";
import { BUSINESS_TYPES } from "@shared/schema";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface PlatformAnalytics {
  totalStores: number;
  activeStores: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  storesByPlan: { plan: string; count: number }[];
  storesByType: { type: string; count: number }[];
  recentStores: { id: number; name: string; slug: string; plan: string; businessType: string | null; isActive: boolean; createdAt: string | null }[];
}

interface PlatformTrends {
  dailyStores: { date: string; count: number }[];
  dailyOrders: { date: string; count: number }[];
  dailyRevenue: { date: string; total: number }[];
  dailyUsers: { date: string; count: number }[];
}

interface PlatformEvent {
  id: number;
  storeId: number;
  storeName: string;
  eventType: string;
  createdAt: string | null;
}

const planLabels: Record<string, string> = { free: "Free", pro: "Pro", business: "Business" };
const planColors: Record<string, string> = {
  free: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  business: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const eventLabels: Record<string, string> = {
  visit: "Просмотр",
  add_to_cart: "В корзину",
  checkout_click: "Оформление",
};

type TrendPeriod = "7d" | "30d" | "90d";

export default function SuperAdminDashboard() {
  const [period, setPeriod] = useState<TrendPeriod>("30d");

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const endDate = new Date().toISOString().split("T")[0];

  const { data, isLoading } = useQuery<PlatformAnalytics>({ queryKey: ["/api/superadmin/analytics"] });
  const { data: trends, isLoading: trendsLoading } = useQuery<PlatformTrends>({
    queryKey: ["/api/superadmin/trends", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/superadmin/trends?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch trends");
      return res.json();
    },
  });
  const { data: events } = useQuery<PlatformEvent[]>({
    queryKey: ["/api/superadmin/events", { limit: 20 }],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/events?limit=20");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Панель управления</h1>
      </div>
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Нет данных для отображения</p>
      </Card>
    </div>
  );

  const stats = [
    { label: "Магазины", value: data.totalStores, sub: `${data.activeStores} активных`, icon: Store, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Пользователи", value: data.totalUsers, icon: Users, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Заказы", value: data.totalOrders, icon: ShoppingCart, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Выручка", value: `${(data.totalRevenue || 0).toLocaleString("ru-RU")} ₸`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Товары", value: data.totalProducts, icon: Package, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Клиенты", value: data.totalCustomers, icon: UserCheck, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  ];

  const formatDate = (d: string) => {
    const parts = d.split("-");
    return `${parts[2]}.${parts[1]}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-superadmin-dashboard-title">Панель SuperAdmin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Обзор платформы TakeSale</p>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d"] as TrendPeriod[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              data-testid={`button-period-${p}`}
            >
              {p === "7d" ? "7 дней" : p === "30d" ? "30 дней" : "90 дней"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5" data-testid={`card-platform-stat-${s.label}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight">{s.value}</p>
            {"sub" in s && s.sub && <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5" data-testid="card-trend-orders">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Заказы за период
          </h2>
          {trendsLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends?.dailyOrders || []}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip labelFormatter={(l) => `Дата: ${l}`} formatter={(v: number) => [v, "Заказы"]} />
                <Area type="monotone" dataKey="count" stroke="#f59e0b" fill="url(#colorOrders)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5" data-testid="card-trend-revenue">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Выручка за период
          </h2>
          {trendsLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends?.dailyRevenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip labelFormatter={(l) => `Дата: ${l}`} formatter={(v: number) => [`${v.toLocaleString("ru-RU")} ₸`, "Выручка"]} />
                <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5" data-testid="card-trend-stores">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            Новые магазины
          </h2>
          {trendsLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends?.dailyStores || []}>
                <defs>
                  <linearGradient id="colorStores" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip labelFormatter={(l) => `Дата: ${l}`} formatter={(v: number) => [v, "Магазины"]} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorStores)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5" data-testid="card-trend-users">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Новые пользователи
          </h2>
          {trendsLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends?.dailyUsers || []}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip labelFormatter={(l) => `Дата: ${l}`} formatter={(v: number) => [v, "Пользователи"]} />
                <Area type="monotone" dataKey="count" stroke="#22c55e" fill="url(#colorUsers)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5" data-testid="card-stores-by-plan">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            По тарифам
          </h2>
          <div className="space-y-3">
            {data.storesByPlan.map((item) => {
              const pct = data.totalStores ? Math.round((item.count / data.totalStores) * 100) : 0;
              return (
                <div key={item.plan} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className={planColors[item.plan] || ""}>
                      {planLabels[item.plan] || item.plan}
                    </Badge>
                    <span className="text-sm font-bold">{item.count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {data.storesByPlan.length === 0 && <p className="text-sm text-muted-foreground">Нет данных</p>}
          </div>
        </Card>

        <Card className="p-5" data-testid="card-stores-by-type">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            По типу бизнеса
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.storesByType.map((item) => {
              const bt = BUSINESS_TYPES[item.type as keyof typeof BUSINESS_TYPES];
              return (
                <div key={item.type} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{bt?.label || item.type}</span>
                  <span className="text-sm font-bold shrink-0">{item.count}</span>
                </div>
              );
            })}
            {data.storesByType.length === 0 && <p className="text-sm text-muted-foreground">Нет данных</p>}
          </div>
        </Card>

        <Card className="p-5" data-testid="card-recent-events">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            Последние события
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events?.slice(0, 10).map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="truncate font-medium">{ev.storeName}</span>
                </div>
                <Badge variant="secondary">{eventLabels[ev.eventType] || ev.eventType}</Badge>
                <span className="text-xs text-muted-foreground shrink-0">
                  {ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </span>
              </div>
            ))}
            {(!events || events.length === 0) && <p className="text-sm text-muted-foreground">Нет событий</p>}
          </div>
          <div className="mt-3">
            <Link href="/superadmin/events" className="text-sm font-medium text-blue-600 hover:underline" data-testid="link-all-events">
              Все события
            </Link>
          </div>
        </Card>
      </div>

      <Card className="p-5" data-testid="card-recent-stores">
        <h2 className="text-sm font-semibold mb-4">Последние магазины</h2>
        <div className="space-y-2">
          {data.recentStores.map((store) => (
            <Link key={store.id} href={`/superadmin/stores/${store.id}`}>
              <div className="flex items-center justify-between gap-3 rounded-md border px-4 py-3 hover-elevate cursor-pointer" data-testid={`row-recent-store-${store.id}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{store.name}</p>
                  <p className="text-xs text-muted-foreground">/s/{store.slug}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={planColors[store.plan] || ""}>
                    {planLabels[store.plan] || store.plan}
                  </Badge>
                  <Badge variant={store.isActive ? "secondary" : "destructive"}>
                    {store.isActive ? "Активен" : "Отключён"}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
          {data.recentStores.length === 0 && <p className="text-sm text-muted-foreground">Нет магазинов</p>}
        </div>
        <div className="mt-4">
          <Link href="/superadmin/stores" className="text-sm font-medium text-blue-600 hover:underline" data-testid="link-all-stores">
            Все магазины
          </Link>
        </div>
      </Card>
    </div>
  );
}
